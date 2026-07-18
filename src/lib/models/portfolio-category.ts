import { Asset, StockAsset } from "./asset";
import { ASSET_TYPE_LABEL } from "./asset-types";

/**
 * Display-level grouping for the portfolio and allocation views. Finer
 * than `AssetType`: stocks split into Korean vs foreign listings. Kept
 * out of the stored model — it's derived from market/ticker/currency, so
 * reclassification never needs a migration.
 */
export type PortfolioCategory =
  | "STOCK_KR"
  | "STOCK_FOREIGN"
  | "BOND"
  | "CASH"
  | "PENSION"
  | "CUSTOM";

export const PORTFOLIO_CATEGORIES: PortfolioCategory[] = [
  "STOCK_KR",
  "STOCK_FOREIGN",
  "BOND",
  "CASH",
  "PENSION",
  "CUSTOM",
];

export const PORTFOLIO_CATEGORY_LABEL: Record<PortfolioCategory, string> = {
  STOCK_KR: "한국주식",
  STOCK_FOREIGN: "해외주식",
  BOND: "채권",
  CASH: "현금",
  PENSION: "연금",
  CUSTOM: "기타",
};

/**
 * Categorical palette validated (dataviz validator) for light/dark
 * surfaces, CVD separation, and the normal-vision floor in the
 * PORTFOLIO_CATEGORIES adjacency order.
 */
export const PORTFOLIO_CATEGORY_COLOR: Record<PortfolioCategory, string> = {
  STOCK_KR: "#2a78d6",
  STOCK_FOREIGN: "#c9548a",
  BOND: "#c98500",
  CASH: "#1baf7a",
  PENSION: "#b9722e",
  CUSTOM: "#8a63d2",
};

function isDomesticStock(asset: StockAsset): boolean {
  const market = (asset.market ?? "").trim().toUpperCase();
  if (market) {
    return market.includes("KOSPI") || market.includes("KOSDAQ") || market.includes("KRX");
  }
  if (asset.ticker && /^\d{6}$/.test(asset.ticker.trim())) return true;
  return (asset.currency ?? "KRW") === "KRW";
}

export function getPortfolioCategory(asset: Asset): PortfolioCategory {
  switch (asset.type) {
    case "STOCK":
      return isDomesticStock(asset) ? "STOCK_KR" : "STOCK_FOREIGN";
    case "BOND":
      return "BOND";
    case "CASH":
      return "CASH";
    case "PENSION":
      return "PENSION";
    case "CUSTOM":
      return "CUSTOM";
  }
}

/** List label for a single asset: user's custom category wins, stocks show KR/foreign. */
export function getAssetCategoryLabel(asset: Asset): string {
  if (asset.type === "CUSTOM" && asset.category) return asset.category;
  if (asset.type === "STOCK") return PORTFOLIO_CATEGORY_LABEL[getPortfolioCategory(asset)];
  return ASSET_TYPE_LABEL[asset.type];
}
