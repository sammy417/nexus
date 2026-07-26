import { Asset, StockAsset } from "@/lib/models/asset";
import { getStockSector } from "@/lib/models/stock-sector";
import { getPortfolioCategory } from "@/lib/models/portfolio-category";
import { getAssetMetrics } from "./portfolio-service";

export interface StockHolding {
  asset: StockAsset;
  sector: string;
  /** "KR" | "FOREIGN", derived from market/ticker/currency. */
  region: "KR" | "FOREIGN";
  principal: number;
  valuation: number;
  profit: number;
  profitRate: number;
  /** Share of total stock valuation, in percent. */
  weight: number;
}

export function isStock(asset: Asset): asset is StockAsset {
  return asset.type === "STOCK";
}

/** Per-stock metrics (KRW base), sorted by valuation desc. */
export function getStockHoldings(assets: Asset[], usdKrw: number): StockHolding[] {
  const stocks = assets.filter(isStock);
  const total = stocks.reduce((sum, s) => sum + getAssetMetrics(s, usdKrw).valuation, 0);
  return stocks
    .map((asset) => {
      const { principal, valuation, profit, profitRate } = getAssetMetrics(asset, usdKrw);
      return {
        asset,
        sector: getStockSector(asset),
        region: getPortfolioCategory(asset) === "STOCK_KR" ? ("KR" as const) : ("FOREIGN" as const),
        principal,
        valuation,
        profit,
        profitRate,
        weight: total === 0 ? 0 : (valuation / total) * 100,
      };
    })
    .sort((a, b) => b.valuation - a.valuation);
}

export interface StockSummary {
  totalValuation: number;
  totalPrincipal: number;
  totalProfit: number;
  totalProfitRate: number;
  count: number;
  gainers: number;
  losers: number;
}

export function getStockSummary(holdings: StockHolding[]): StockSummary {
  const totalValuation = holdings.reduce((s, h) => s + h.valuation, 0);
  const totalPrincipal = holdings.reduce((s, h) => s + h.principal, 0);
  const totalProfit = totalValuation - totalPrincipal;
  return {
    totalValuation,
    totalPrincipal,
    totalProfit,
    totalProfitRate: totalPrincipal === 0 ? 0 : (totalProfit / totalPrincipal) * 100,
    count: holdings.length,
    gainers: holdings.filter((h) => h.profit > 0).length,
    losers: holdings.filter((h) => h.profit < 0).length,
  };
}

export interface GroupWeight {
  key: string;
  valuation: number;
  ratio: number;
}

/** Valuation share per sector, largest first. */
export function getSectorAllocation(holdings: StockHolding[]): GroupWeight[] {
  return groupBy(holdings, (h) => h.sector);
}

/** KR vs foreign valuation share. */
export function getRegionAllocation(holdings: StockHolding[]): GroupWeight[] {
  return groupBy(holdings, (h) => h.region);
}

/** KRW vs USD valuation share (trading currency exposure). */
export function getCurrencyAllocation(holdings: StockHolding[]): GroupWeight[] {
  return groupBy(holdings, (h) => h.asset.currency ?? "KRW");
}

function groupBy(holdings: StockHolding[], key: (h: StockHolding) => string): GroupWeight[] {
  const total = holdings.reduce((s, h) => s + h.valuation, 0);
  const map = new Map<string, number>();
  for (const h of holdings) map.set(key(h), (map.get(key(h)) ?? 0) + h.valuation);
  return [...map.entries()]
    .map(([k, valuation]) => ({
      key: k,
      valuation,
      ratio: total === 0 ? 0 : (valuation / total) * 100,
    }))
    .sort((a, b) => b.valuation - a.valuation);
}

export interface Concentration {
  count: number;
  /** Combined weight of the top 5 holdings, percent. */
  top5Weight: number;
  /** Herfindahl-Hirschman index over weights (0–10000). */
  hhi: number;
  /** Effective number of holdings (1 / sum of squared shares). */
  effectiveN: number;
  /** 0–100, higher = better diversified. */
  diversificationScore: number;
}

export function getConcentration(holdings: StockHolding[]): Concentration {
  const count = holdings.length;
  if (count === 0) {
    return { count: 0, top5Weight: 0, hhi: 0, effectiveN: 0, diversificationScore: 0 };
  }
  const shares = holdings.map((h) => h.weight / 100); // fractions summing to ~1
  const top5Weight = holdings.slice(0, 5).reduce((s, h) => s + h.weight, 0);
  const hhi = shares.reduce((s, w) => s + w * w, 0) * 10000;
  const effectiveN = hhi === 0 ? 0 : 10000 / hhi;
  // Score effective-N against the ideal (all N equal-weighted → effectiveN = N).
  const diversificationScore = count <= 1 ? 0 : Math.round((effectiveN / count) * 100);
  return { count, top5Weight, hhi, effectiveN, diversificationScore };
}

export interface Contribution {
  holding: StockHolding;
  /** Contribution to total P&L, percent of total profit magnitude. */
  share: number;
}

/**
 * Each stock's contribution to total P&L. `share` is signed and scaled to
 * the sum of absolute profits so gainers/losers are comparable.
 */
export function getContributions(holdings: StockHolding[]): Contribution[] {
  const absTotal = holdings.reduce((s, h) => s + Math.abs(h.profit), 0);
  return holdings
    .map((holding) => ({
      holding,
      share: absTotal === 0 ? 0 : (holding.profit / absTotal) * 100,
    }))
    .sort((a, b) => b.holding.profit - a.holding.profit);
}
