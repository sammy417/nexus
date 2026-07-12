export type AssetType = "STOCK" | "CASH" | "REAL_ESTATE";

export const ASSET_TYPE_LABEL: Record<AssetType, string> = {
  STOCK: "주식",
  CASH: "현금",
  REAL_ESTATE: "부동산",
};

export const ASSET_TYPES: AssetType[] = ["STOCK", "CASH", "REAL_ESTATE"];

interface BaseAsset {
  id: string;
  name: string;
}

export interface StockAsset extends BaseAsset {
  type: "STOCK";
  ticker?: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
}

export interface CashAsset extends BaseAsset {
  type: "CASH";
  amount: number;
}

export interface RealEstateAsset extends BaseAsset {
  type: "REAL_ESTATE";
  purchasePrice: number;
  currentValue: number;
}

export type Asset = StockAsset | CashAsset | RealEstateAsset;
