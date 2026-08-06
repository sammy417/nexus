import { OwnerFilter } from "./asset-owner";

/**
 * Inputs for the 은퇴(retirement) projection. Everything the projection needs
 * beyond these is derived from assets the app already holds, so the form asks
 * for as little as possible.
 *
 * Monetary fields are **today's money** (in KRW) — the projection handles
 * inflation itself, so the user never has to guess future prices. Rates are
 * annual percentages.
 *
 * Stored per owner-filter (전체 / 본인 / 배우자 / 자녀): retirement is an
 * individual matter, and the page already scopes assets by the same filter,
 * so "본인" projects 본인's assets against 본인's plan.
 */
export interface RetirementInputs {
  /** Birth year (Gregorian). 0 = not set yet. */
  birthYear: number;
  /** Age at which work income stops and withdrawals begin. */
  retirementAge: number;
  /** Age the plan should stay funded until. */
  lifeExpectancy: number;
  /** Monthly living cost in retirement, in today's money. */
  monthlyExpenseKrw: number;
  /** Other monthly retirement income in today's money (국민연금 등), subtracted from the expense. */
  otherMonthlyIncomeKrw: number;
  /** Expected nominal annual return, percent. */
  expectedReturnPct: number;
  /** Assumed annual inflation, percent — turns nominal returns into real ones. */
  inflationPct: number;
  /** Manual monthly saving in today's money, used when `useDetectedSaving` is false. */
  monthlySavingKrw: number;
  /** When true, the projection uses the saving pace detected from history instead of `monthlySavingKrw`. */
  useDetectedSaving: boolean;
}

export const DEFAULT_RETIREMENT_INPUTS: RetirementInputs = {
  birthYear: 0,
  retirementAge: 60,
  lifeExpectancy: 90,
  monthlyExpenseKrw: 0,
  otherMonthlyIncomeKrw: 0,
  expectedReturnPct: 5,
  inflationPct: 2.5,
  monthlySavingKrw: 0,
  useDetectedSaving: true,
};

/** Quick-pick nominal return assumptions offered next to the field. */
export const RETURN_PRESETS = [
  { label: "보수적", pct: 3 },
  { label: "기본", pct: 5 },
  { label: "공격적", pct: 7 },
] as const;

export type RetirementInputsByScope = Partial<Record<OwnerFilter, RetirementInputs>>;

const MIN_BIRTH_YEAR = 1900;

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function nonNegative(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** Coerce an unknown stored/imported value into complete, sane inputs. */
export function normalizeRetirementInputs(value: unknown): RetirementInputs {
  if (!value || typeof value !== "object") return { ...DEFAULT_RETIREMENT_INPUTS };
  const raw = value as Record<string, unknown>;

  const thisYear = new Date().getUTCFullYear();
  const birthYear =
    Number.isFinite(Number(raw.birthYear)) &&
    Number(raw.birthYear) >= MIN_BIRTH_YEAR &&
    Number(raw.birthYear) <= thisYear
      ? Math.floor(Number(raw.birthYear))
      : 0;

  const retirementAge = clampNumber(raw.retirementAge, 30, 90, 60);
  // Life expectancy must leave at least one year of retirement to fund.
  const lifeExpectancy = clampNumber(raw.lifeExpectancy, retirementAge + 1, 120, Math.max(90, retirementAge + 1));

  return {
    birthYear,
    retirementAge,
    lifeExpectancy,
    monthlyExpenseKrw: nonNegative(raw.monthlyExpenseKrw),
    otherMonthlyIncomeKrw: nonNegative(raw.otherMonthlyIncomeKrw),
    expectedReturnPct: clampNumber(raw.expectedReturnPct, -10, 30, 5),
    inflationPct: clampNumber(raw.inflationPct, 0, 15, 2.5),
    monthlySavingKrw: nonNegative(raw.monthlySavingKrw),
    useDetectedSaving: typeof raw.useDetectedSaving === "boolean" ? raw.useDetectedSaving : true,
  };
}

/** Normalize the whole per-scope map, dropping unknown scopes. */
export function normalizeRetirementByScope(value: unknown): RetirementInputsByScope {
  if (!value || typeof value !== "object") return {};
  const source = value as Record<string, unknown>;
  const scopes: OwnerFilter[] = ["ALL", "SELF", "SPOUSE", "CHILD", "JOINT"];
  const result: RetirementInputsByScope = {};
  for (const scope of scopes) {
    if (source[scope] !== undefined) result[scope] = normalizeRetirementInputs(source[scope]);
  }
  return result;
}

/** Enough is filled in to run a projection. */
export function isRetirementConfigured(inputs: RetirementInputs): boolean {
  return inputs.birthYear > 0 && inputs.monthlyExpenseKrw > 0;
}

/** This scope's inputs, or the defaults when nothing is stored yet. */
export function getRetirementInputs(
  byScope: RetirementInputsByScope | undefined,
  scope: OwnerFilter
): RetirementInputs {
  return byScope?.[scope] ?? DEFAULT_RETIREMENT_INPUTS;
}

/** A copy of the map with one scope patched. */
export function withRetirementInputs(
  byScope: RetirementInputsByScope | undefined,
  scope: OwnerFilter,
  patch: Partial<RetirementInputs>
): RetirementInputsByScope {
  const current = getRetirementInputs(byScope, scope);
  return { ...byScope, [scope]: { ...current, ...patch } };
}
