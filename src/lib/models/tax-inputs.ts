import { AssetOwner } from "./asset";
import { ASSET_OWNERS } from "./asset-owner";

/**
 * Manual figures the tax page needs but cannot derive from stored data:
 * gains already realized this year, payouts that never got recorded, and
 * this year's pension contributions (the asset model stores cumulative
 * principal, not the annual amount).
 *
 * These used to live in component `useState`, so every reload or navigation
 * wiped them and the simulators quietly fell back to zero — which reads as
 * "no tax due" rather than "no input yet". They're persisted here instead.
 *
 * Keyed by **year and owner**, both of which matter:
 *   - every figure is an annual one, so last year's numbers must not carry
 *     into a new tax year;
 *   - the deductions and thresholds they feed are per person, never per
 *     household.
 */

export type RealizedSign = "GAIN" | "LOSS";

export interface TaxYearInputs {
  /** Sign of the realized capital gains figure — kept separate so the toggle survives a 0 amount. */
  realizedSign: RealizedSign;
  /** Magnitude of gains/losses already realized this year (KRW, always ≥ 0). */
  realizedMagnitudeKrw: number;
  /** Dividends/interest received but not entered in the 배당 menu (KRW). */
  unrecordedDividendKrw: number;
  /** 연금저축 paid in this year (KRW). */
  pensionSavingsKrw: number;
  /** IRP paid in this year (KRW). */
  irpKrw: number;
  /** Income bracket driving the credit rate (16.5% when true, else 13.2%). */
  isLowIncome: boolean;
  /** Asset ids unchecked in the "추가로 더 판다면" simulation. */
  excludedLotIds: string[];
}

export const DEFAULT_TAX_YEAR_INPUTS: TaxYearInputs = {
  realizedSign: "GAIN",
  realizedMagnitudeKrw: 0,
  unrecordedDividendKrw: 0,
  pensionSavingsKrw: 0,
  irpKrw: 0,
  isLowIncome: true,
  excludedLotIds: [],
};

/** `taxInputs[year][owner]`. Years absent from the map fall back to defaults. */
export type TaxInputsByYear = Record<string, Partial<Record<AssetOwner, TaxYearInputs>>>;

/**
 * Years kept in settings. Past years are worth holding on to (they're what
 * the figures were filed against) but not forever — this bounds the blob.
 */
const RETAINED_YEARS = 5;

/** The tax year the page is currently filling in. */
export function currentTaxYear(): string {
  return String(new Date().getUTCFullYear());
}

/**
 * Signed realized P&L for the tax service, derived from the stored sign +
 * magnitude. The `> 0` guard keeps an empty LOSS field at +0 rather than
 * -0, which would otherwise render as "-₩0" in the summary tile.
 */
export function realizedGainsKrw(inputs: TaxYearInputs): number {
  const magnitude = Math.max(0, inputs.realizedMagnitudeKrw);
  return inputs.realizedSign === "LOSS" && magnitude > 0 ? -magnitude : magnitude;
}

function positiveNumber(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function normalizeYearInputs(value: unknown): TaxYearInputs {
  if (!value || typeof value !== "object") return { ...DEFAULT_TAX_YEAR_INPUTS };
  const raw = value as Record<string, unknown>;
  return {
    realizedSign: raw.realizedSign === "LOSS" ? "LOSS" : "GAIN",
    realizedMagnitudeKrw: positiveNumber(raw.realizedMagnitudeKrw),
    unrecordedDividendKrw: positiveNumber(raw.unrecordedDividendKrw),
    pensionSavingsKrw: positiveNumber(raw.pensionSavingsKrw),
    irpKrw: positiveNumber(raw.irpKrw),
    isLowIncome: typeof raw.isLowIncome === "boolean" ? raw.isLowIncome : true,
    excludedLotIds: Array.isArray(raw.excludedLotIds)
      ? raw.excludedLotIds.filter((id): id is string => typeof id === "string")
      : [],
  };
}

/** Coerce an unknown stored/imported value into a complete tax-input map. */
export function normalizeTaxInputsByYear(value: unknown): TaxInputsByYear {
  if (!value || typeof value !== "object") return {};
  const source = value as Record<string, unknown>;

  const years = Object.keys(source)
    .filter((year) => /^\d{4}$/.test(year))
    .sort()
    .slice(-RETAINED_YEARS);

  const result: TaxInputsByYear = {};
  for (const year of years) {
    const rawOwners = source[year];
    if (!rawOwners || typeof rawOwners !== "object") continue;
    const owners: Partial<Record<AssetOwner, TaxYearInputs>> = {};
    for (const owner of ASSET_OWNERS) {
      const entry = (rawOwners as Record<string, unknown>)[owner];
      if (entry !== undefined) owners[owner] = normalizeYearInputs(entry);
    }
    if (Object.keys(owners).length > 0) result[year] = owners;
  }
  return result;
}

/** This owner's figures for a year, or the defaults when nothing is stored yet. */
export function getTaxInputs(
  byYear: TaxInputsByYear | undefined,
  year: string,
  owner: AssetOwner
): TaxYearInputs {
  return byYear?.[year]?.[owner] ?? DEFAULT_TAX_YEAR_INPUTS;
}

/** A copy of the map with one owner-year patched. */
export function withTaxInputs(
  byYear: TaxInputsByYear | undefined,
  year: string,
  owner: AssetOwner,
  patch: Partial<TaxYearInputs>
): TaxInputsByYear {
  const current = getTaxInputs(byYear, year, owner);
  return {
    ...byYear,
    [year]: { ...byYear?.[year], [owner]: { ...current, ...patch } },
  };
}
