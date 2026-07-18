import { AssetType } from "./asset";

/** Display order for asset type sections (portfolio page, allocation chart, ...). */
export const ASSET_TYPES: AssetType[] = ["STOCK", "CASH"];

export const ASSET_TYPE_LABEL: Record<AssetType, string> = {
  STOCK: "주식",
  CASH: "현금",
};
