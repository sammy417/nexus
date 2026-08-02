import { Asset } from "@/lib/models/asset";
import {
  getPortfolioCategory,
  PORTFOLIO_CATEGORIES,
  PortfolioCategory,
} from "@/lib/models/portfolio-category";
import {
  RELATIVE_BAND,
  TargetAllocationSettings,
} from "@/lib/models/target-allocation";
import { getAssetMetrics } from "./portfolio-service";

/**
 * Drift of the current portfolio against the user's target allocation, plus
 * the trades that would close it. All amounts are KRW-base (same conversion
 * as the rest of the app).
 *
 * Out-of-band is the 5/25 rule: a sleeve needs action once it drifts past
 * the absolute band (default 5%p) OR a quarter of its own target weight,
 * whichever is tighter. Sleeves with a 0% target use the absolute band only.
 */

export interface RebalanceRow {
  category: PortfolioCategory;
  currentValuation: number;
  /** Share of total valuation, percent. */
  currentRatio: number;
  targetRatio: number;
  /** current − target, in percentage points (positive = overweight). */
  driftPct: number;
  targetValuation: number;
  /** target − current: positive = buy this much, negative = sell. */
  deltaValuation: number;
  /** Drift tolerance applied to this sleeve, in percentage points. */
  tolerancePct: number;
  outOfBand: boolean;
}

export interface RebalancePlan {
  rows: RebalanceRow[];
  totalValuation: number;
  /** Largest absolute drift across sleeves, in percentage points. */
  maxAbsDrift: number;
  needsRebalancing: boolean;
  /** Valuation of home-flagged assets left out of the math (0 unless `excludeHome` is on). */
  excludedHomeValuation: number;
}

/** Tolerance for one sleeve under the 5/25 rule, in percentage points. */
function toleranceFor(targetRatio: number, bandPct: number): number {
  if (targetRatio <= 0) return bandPct;
  return Math.min(bandPct, targetRatio * RELATIVE_BAND);
}

function isHomeAsset(asset: Asset): boolean {
  return asset.type === "CUSTOM" && asset.isHome === true;
}

export function getRebalancePlan(
  assets: Asset[],
  usdKrw: number,
  target: TargetAllocationSettings
): RebalancePlan {
  const valuations = new Map<PortfolioCategory, number>();
  let totalValuation = 0;
  let excludedHomeValuation = 0;
  for (const asset of assets) {
    const { valuation } = getAssetMetrics(asset, usdKrw);
    if (target.excludeHome && isHomeAsset(asset)) {
      excludedHomeValuation += valuation;
      continue;
    }
    const category = getPortfolioCategory(asset);
    valuations.set(category, (valuations.get(category) ?? 0) + valuation);
    totalValuation += valuation;
  }

  const rows: RebalanceRow[] = PORTFOLIO_CATEGORIES.map((category) => {
    const currentValuation = valuations.get(category) ?? 0;
    const currentRatio = totalValuation === 0 ? 0 : (currentValuation / totalValuation) * 100;
    const targetRatio = target.weights[category] ?? 0;
    const targetValuation = totalValuation * (targetRatio / 100);
    const driftPct = currentRatio - targetRatio;
    const tolerancePct = toleranceFor(targetRatio, target.bandPct);
    return {
      category,
      currentValuation,
      currentRatio,
      targetRatio,
      driftPct,
      targetValuation,
      deltaValuation: targetValuation - currentValuation,
      tolerancePct,
      // An empty portfolio has nothing to rebalance yet.
      outOfBand: totalValuation > 0 && Math.abs(driftPct) > tolerancePct,
    };
  });

  const maxAbsDrift = rows.reduce((max, row) => Math.max(max, Math.abs(row.driftPct)), 0);

  return {
    rows,
    totalValuation,
    maxAbsDrift,
    needsRebalancing: rows.some((row) => row.outOfBand),
    excludedHomeValuation,
  };
}

export interface ContributionRow {
  category: PortfolioCategory;
  /** How much of the new cash to put into this sleeve (KRW). */
  amount: number;
}

/**
 * Cash-flow rebalancing: close the gap by directing new money to the
 * underweight sleeves instead of selling the overweight ones — no realized
 * gains, no trading costs on the sell side.
 *
 * Each sleeve's shortfall is measured against the post-contribution total,
 * and the new cash is split across shortfalls in proportion. (Shortfalls
 * always sum to at least the contribution, so this never over-allocates.)
 */
export function getContributionPlan(plan: RebalancePlan, newCash: number): ContributionRow[] {
  if (newCash <= 0) return [];
  const newTotal = plan.totalValuation + newCash;

  const shortfalls = plan.rows.map((row) => ({
    category: row.category,
    shortfall: Math.max(0, newTotal * (row.targetRatio / 100) - row.currentValuation),
  }));
  const totalShortfall = shortfalls.reduce((sum, entry) => sum + entry.shortfall, 0);
  if (totalShortfall <= 0) return [];

  return shortfalls
    .filter((entry) => entry.shortfall > 0)
    .map((entry) => ({
      category: entry.category,
      amount: newCash * (entry.shortfall / totalShortfall),
    }))
    .sort((a, b) => b.amount - a.amount);
}
