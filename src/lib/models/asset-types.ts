import { AssetType } from "./asset";

/** Display order for asset type sections (portfolio page, allocation chart, ...). */
export const ASSET_TYPES: AssetType[] = ["STOCK", "BOND", "CASH", "CUSTOM"];

export const ASSET_TYPE_LABEL: Record<AssetType, string> = {
  STOCK: "주식",
  BOND: "채권",
  CASH: "현금",
  CUSTOM: "기타",
};
