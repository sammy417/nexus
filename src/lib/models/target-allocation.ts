import { PORTFOLIO_CATEGORIES, PortfolioCategory } from "./portfolio-category";

/**
 * Target asset allocation — the "where you want to be" counterpart to the
 * dashboard's current allocation. Weights are percentages of total
 * valuation and must sum to 100.
 *
 * The presets below are starting points grounded in standard portfolio
 * construction, not personalized advice; every weight is editable in
 * settings.
 */

export type TargetWeights = Record<PortfolioCategory, number>;

export interface TargetAllocationSettings {
  /** When false, the rebalancing card is hidden entirely. */
  enabled: boolean;
  weights: TargetWeights;
  /** Absolute drift tolerance in percentage points (the 5/25 rule's absolute leg). */
  bandPct: number;
}

/**
 * Relative leg of the 5/25 rebalancing rule: a sleeve is also out of band
 * once it drifts 25% of its own target (so a 10% target tolerates 2.5%p,
 * not the full absolute band). Fixed at the conventional value — the
 * absolute leg is what users tune.
 */
export const RELATIVE_BAND = 0.25;

export const DEFAULT_BAND_PCT = 5;
export const MIN_BAND_PCT = 1;
export const MAX_BAND_PCT = 20;

export interface AllocationPreset {
  id: "STABLE" | "BALANCED" | "GROWTH" | "AGGRESSIVE";
  label: string;
  /** One-line rationale shown under the preset buttons. */
  summary: string;
  weights: TargetWeights;
}

/**
 * Four risk levels along the classic equity/bond glide path. The domestic
 * vs foreign equity split stays near 1:2 — a common compromise between
 * global market-cap weighting (which would leave Korea near a rounding
 * error) and the home bias most Korean investors actually run.
 */
export const ALLOCATION_PRESETS: AllocationPreset[] = [
  {
    id: "STABLE",
    label: "안정형",
    summary: "주식 30 · 채권 40 — 원금 보존과 변동성 억제를 우선합니다.",
    weights: { STOCK_KR: 10, STOCK_FOREIGN: 20, BOND: 40, CASH: 15, PENSION: 15, CUSTOM: 0 },
  },
  {
    id: "BALANCED",
    label: "중립형",
    summary: "주식 60 · 채권 25 — 고전적인 60/40 균형 포트폴리오에 가깝습니다.",
    weights: { STOCK_KR: 20, STOCK_FOREIGN: 40, BOND: 25, CASH: 5, PENSION: 10, CUSTOM: 0 },
  },
  {
    id: "GROWTH",
    label: "성장형",
    summary: "주식 75 · 채권 10 — 장기 투자 기간을 전제로 수익을 우선합니다.",
    weights: { STOCK_KR: 25, STOCK_FOREIGN: 50, BOND: 10, CASH: 5, PENSION: 10, CUSTOM: 0 },
  },
  {
    id: "AGGRESSIVE",
    label: "공격형",
    summary: "주식 85 — 큰 하락을 감내할 수 있을 때만 선택하세요.",
    weights: { STOCK_KR: 30, STOCK_FOREIGN: 55, BOND: 0, CASH: 5, PENSION: 10, CUSTOM: 0 },
  },
];

/** Sensible starting point when the user hasn't chosen one yet. */
export const DEFAULT_PRESET_ID: AllocationPreset["id"] = "BALANCED";

export const DEFAULT_TARGET_ALLOCATION: TargetAllocationSettings = {
  enabled: true,
  weights: { ...ALLOCATION_PRESETS.find((p) => p.id === DEFAULT_PRESET_ID)!.weights },
  bandPct: DEFAULT_BAND_PCT,
};

export function sumWeights(weights: TargetWeights): number {
  return PORTFOLIO_CATEGORIES.reduce((sum, category) => sum + (weights[category] ?? 0), 0);
}

/** The preset these weights match exactly, if any (for highlighting the picker). */
export function matchingPresetId(weights: TargetWeights): AllocationPreset["id"] | null {
  const preset = ALLOCATION_PRESETS.find((candidate) =>
    PORTFOLIO_CATEGORIES.every((category) => candidate.weights[category] === weights[category])
  );
  return preset?.id ?? null;
}

function clampWeight(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(100, Math.round(n * 10) / 10);
}

/** Coerce an unknown stored/imported value into complete target settings. */
export function normalizeTargetAllocation(value: unknown): TargetAllocationSettings {
  const weights: TargetWeights = { ...DEFAULT_TARGET_ALLOCATION.weights };
  let enabled = DEFAULT_TARGET_ALLOCATION.enabled;
  let bandPct = DEFAULT_TARGET_ALLOCATION.bandPct;

  if (value && typeof value === "object") {
    const raw = value as Record<string, unknown>;
    if (typeof raw.enabled === "boolean") enabled = raw.enabled;

    const rawBand = typeof raw.bandPct === "number" ? raw.bandPct : Number(raw.bandPct);
    if (Number.isFinite(rawBand)) {
      bandPct = Math.min(MAX_BAND_PCT, Math.max(MIN_BAND_PCT, Math.round(rawBand * 10) / 10));
    }

    const rawWeights = raw.weights;
    if (rawWeights && typeof rawWeights === "object") {
      const source = rawWeights as Record<string, unknown>;
      const parsed = {} as TargetWeights;
      for (const category of PORTFOLIO_CATEGORIES) {
        parsed[category] = clampWeight(source[category]);
      }
      // Only accept a stored set that actually adds up; otherwise the card
      // would silently compare against a broken target.
      if (Math.abs(sumWeights(parsed) - 100) < 0.05) {
        for (const category of PORTFOLIO_CATEGORIES) weights[category] = parsed[category];
      }
    }
  }

  return { enabled, weights, bandPct };
}
