import { Asset, AssetType } from "@/lib/models/asset";
import { ASSET_TYPES } from "@/lib/models/asset-types";

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

export function getAssetMetrics(asset: Asset): AssetMetrics {
  switch (asset.type) {
    case "STOCK":
      return toMetrics(asset.avgPrice * asset.quantity, asset.currentPrice * asset.quantity);
    case "CASH":
      return toMetrics(asset.balance, asset.balance);
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

export function getPortfolioSummary(assets: Asset[]): PortfolioSummary {
  const totals = assets.reduce(
    (acc, asset) => {
      const { principal, valuation } = getAssetMetrics(asset);
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

export function getAllocationByType(assets: Asset[]): AllocationEntry[] {
  const totalValuation = assets.reduce((sum, asset) => sum + getAssetMetrics(asset).valuation, 0);

  return ASSET_TYPES.map((type) => {
    const valuation = assets
      .filter((asset) => asset.type === type)
      .reduce((sum, asset) => sum + getAssetMetrics(asset).valuation, 0);
    const ratio = totalValuation === 0 ? 0 : (valuation / totalValuation) * 100;
    return { type, valuation, ratio };
  }).filter((entry) => entry.valuation > 0);
}
