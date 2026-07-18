import { Asset, AssetType, Currency } from "@/lib/models/asset";
import { ASSET_TYPES } from "@/lib/models/asset-types";
import {
  getPortfolioCategory,
  PORTFOLIO_CATEGORIES,
  PortfolioCategory,
} from "@/lib/models/portfolio-category";

/**
 * All metrics are computed in KRW. Assets denominated in USD are
 * converted at read time with the given USDKRW rate, so valuations track
 * both the market price and the exchange rate without rewriting stored
 * amounts. Callers obtain the live rate from /api/fx (client) or
 * fetchUsdKrwRate (server) — `DEFAULT_USD_KRW` is only the offline
 * fallback.
 */
export const DEFAULT_USD_KRW = 1400;

function toKrw(value: number, currency: Currency | undefined, usdKrw: number): number {
  return currency === "USD" ? value * usdKrw : value;
}

export interface AssetMetrics {
  principal: number;
  valuation: number;
  profit: number;
  profitRate: number;
}

function toMetrics(principal: number, valuation: number): AssetMetrics {
  const profit = valuation - principal;
  const profitRate = principal === 0 ? 0 : (profit / principal) * 100;
  return { principal, valuation, profit, profitRate };
}

function assertNever(value: never): never {
  throw new Error(`Unhandled asset type: ${JSON.stringify(value)}`);
}

export function getAssetMetrics(asset: Asset, usdKrw: number): AssetMetrics {
  const convert = (value: number) => toKrw(value, asset.currency, usdKrw);
  switch (asset.type) {
    case "STOCK":
      return toMetrics(convert(asset.avgPrice * asset.quantity), convert(asset.currentPrice * asset.quantity));
    case "CASH":
      return toMetrics(convert(asset.balance), convert(asset.balance));
    case "BOND":
      return toMetrics(convert(asset.purchasePrice), convert(asset.currentValue));
    case "PENSION":
      return toMetrics(convert(asset.principalPaid), convert(asset.currentValue));
    case "CUSTOM":
      return toMetrics(convert(asset.purchasePrice), convert(asset.currentValue));
    default:
      return assertNever(asset);
  }
}

export interface PortfolioSummary {
  totalPrincipal: number;
  totalValuation: number;
  totalProfit: number;
  totalProfitRate: number;
}

export function getPortfolioSummary(assets: Asset[], usdKrw: number): PortfolioSummary {
  const totals = assets.reduce(
    (acc, asset) => {
      const { principal, valuation } = getAssetMetrics(asset, usdKrw);
      acc.totalPrincipal += principal;
      acc.totalValuation += valuation;
      return acc;
    },
    { totalPrincipal: 0, totalValuation: 0 }
  );

  const totalProfit = totals.totalValuation - totals.totalPrincipal;
  const totalProfitRate =
    totals.totalPrincipal === 0 ? 0 : (totalProfit / totals.totalPrincipal) * 100;

  return {
    totalPrincipal: totals.totalPrincipal,
    totalValuation: totals.totalValuation,
    totalProfit,
    totalProfitRate,
  };
}

export interface AllocationEntry {
  type: AssetType;
  valuation: number;
  ratio: number;
}

export interface CategoryAllocationEntry {
  category: PortfolioCategory;
  valuation: number;
  ratio: number;
}

/** Allocation by display category (Korean/foreign stocks split). */
export function getAllocationByCategory(
  assets: Asset[],
  usdKrw: number
): CategoryAllocationEntry[] {
  const totalValuation = assets.reduce(
    (sum, asset) => sum + getAssetMetrics(asset, usdKrw).valuation,
    0
  );

  return PORTFOLIO_CATEGORIES.map((category) => {
    const valuation = assets
      .filter((asset) => getPortfolioCategory(asset) === category)
      .reduce((sum, asset) => sum + getAssetMetrics(asset, usdKrw).valuation, 0);
    const ratio = totalValuation === 0 ? 0 : (valuation / totalValuation) * 100;
    return { category, valuation, ratio };
  }).filter((entry) => entry.valuation > 0);
}

export function getAllocationByType(assets: Asset[], usdKrw: number): AllocationEntry[] {
  const totalValuation = assets.reduce(
    (sum, asset) => sum + getAssetMetrics(asset, usdKrw).valuation,
    0
  );

  return ASSET_TYPES.map((type) => {
    const valuation = assets
      .filter((asset) => asset.type === type)
      .reduce((sum, asset) => sum + getAssetMetrics(asset, usdKrw).valuation, 0);
    const ratio = totalValuation === 0 ? 0 : (valuation / totalValuation) * 100;
    return { type, valuation, ratio };
  }).filter((entry) => entry.valuation > 0);
}
