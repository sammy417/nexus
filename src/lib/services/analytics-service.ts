import { Asset } from "@/lib/models/asset";
import { PortfolioSnapshot } from "@/lib/models/snapshot";
import {
  getPortfolioCategory,
  PORTFOLIO_CATEGORIES,
  PortfolioCategory,
} from "@/lib/models/portfolio-category";
import { getAssetMetrics } from "./portfolio-service";

/**
 * Pure derivations over the snapshot history and current assets for the
 * analytics page. Percentages are computed on the KRW base series, so
 * they are independent of the display currency.
 */

export interface MonthlyReturn {
  /** YYYY-MM */
  month: string;
  /** e.g. "5월" */
  label: string;
  /** Month-over-month change of total valuation, in percent. */
  returnRate: number;
}

/** Last snapshot of each month → month-over-month valuation change. */
export function getMonthlyReturns(snapshots: PortfolioSnapshot[], maxMonths = 12): MonthlyReturn[] {
  const lastPerMonth = new Map<string, PortfolioSnapshot>();
  for (const snapshot of snapshots) {
    lastPerMonth.set(snapshot.date.slice(0, 7), snapshot);
  }
  const months = [...lastPerMonth.keys()].sort();

  const returns: MonthlyReturn[] = [];
  for (let i = 1; i < months.length; i++) {
    const prev = lastPerMonth.get(months[i - 1])!;
    const curr = lastPerMonth.get(months[i])!;
    if (prev.totalValuation === 0) continue;
    returns.push({
      month: months[i],
      label: `${Number(months[i].slice(5))}월`,
      returnRate: (curr.totalValuation / prev.totalValuation - 1) * 100,
    });
  }
  return returns.slice(-maxMonths);
}

/** Valuation change over the trailing N days, in percent (null if not enough history). */
export function getWindowReturn(snapshots: PortfolioSnapshot[], days: number): number | null {
  if (snapshots.length < 2) return null;
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - days);
  const cutoffKey = cutoff.toISOString().slice(0, 10);
  const window = snapshots.filter((s) => s.date >= cutoffKey);
  if (window.length < 2) return null;
  const first = window[0].totalValuation;
  if (first === 0) return null;
  return (window[window.length - 1].totalValuation / first - 1) * 100;
}

/** Maximum drawdown over the whole history, as a negative percent. */
export function getMaxDrawdown(snapshots: PortfolioSnapshot[]): number | null {
  if (snapshots.length < 2) return null;
  let peak = -Infinity;
  let maxDrawdown = 0;
  for (const snapshot of snapshots) {
    peak = Math.max(peak, snapshot.totalValuation);
    if (peak > 0) {
      maxDrawdown = Math.min(maxDrawdown, (snapshot.totalValuation / peak - 1) * 100);
    }
  }
  return maxDrawdown;
}

export interface CategoryProfit {
  category: PortfolioCategory;
  principal: number;
  valuation: number;
  profit: number;
  profitRate: number;
}

/** Current P&L per display category (KRW base). */
export function getCategoryProfits(assets: Asset[], usdKrw: number): CategoryProfit[] {
  return PORTFOLIO_CATEGORIES.map((category) => {
    const group = assets.filter((asset) => getPortfolioCategory(asset) === category);
    const totals = group.reduce(
      (acc, asset) => {
        const { principal, valuation } = getAssetMetrics(asset, usdKrw);
        acc.principal += principal;
        acc.valuation += valuation;
        return acc;
      },
      { principal: 0, valuation: 0 }
    );
    const profit = totals.valuation - totals.principal;
    return {
      category,
      principal: totals.principal,
      valuation: totals.valuation,
      profit,
      profitRate: totals.principal === 0 ? 0 : (profit / totals.principal) * 100,
    };
  }).filter((entry) => entry.valuation > 0 || entry.principal > 0);
}
