import { Asset, AssetOwner } from "./asset";

export const ASSET_OWNERS: AssetOwner[] = ["SELF", "SPOUSE", "JOINT"];

export const ASSET_OWNER_LABEL: Record<AssetOwner, string> = {
  SELF: "본인",
  SPOUSE: "배우자",
  JOINT: "공동",
};

/** Filter value: a specific owner or the combined household view. */
export type OwnerFilter = AssetOwner | "ALL";

export function getAssetOwner(asset: Asset): AssetOwner {
  return asset.owner ?? "JOINT";
}

export function matchesOwnerFilter(asset: Asset, filter: OwnerFilter): boolean {
  return filter === "ALL" || getAssetOwner(asset) === filter;
}
