import { Asset, AssetOwner } from "./asset";

export const ASSET_OWNERS: AssetOwner[] = ["SELF", "SPOUSE", "CHILD", "JOINT"];

/** Default display names; overridable per household in settings. */
export const ASSET_OWNER_LABEL: Record<AssetOwner, string> = {
  SELF: "본인",
  SPOUSE: "배우자",
  CHILD: "자녀",
  JOINT: "공동",
};

/** Donut/legend hex colors — validated 4-slot palette for both surfaces. */
export const OWNER_COLOR: Record<AssetOwner, string> = {
  SELF: "#3182F6",
  SPOUSE: "#c9548a",
  CHILD: "#1baf7a",
  JOINT: "#c98500",
};

/** Tailwind badge classes tinted to match OWNER_COLOR. */
export const OWNER_BADGE_CLASS: Record<AssetOwner, string> = {
  SELF: "bg-fall/10 text-fall",
  SPOUSE: "bg-[#c9548a]/10 text-[#c9548a]",
  CHILD: "bg-[#1baf7a]/10 text-[#1baf7a]",
  JOINT: "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400",
};

/** Filter value: a specific owner or the combined household view. */
export type OwnerFilter = AssetOwner | "ALL";

export function getAssetOwner(asset: Asset): AssetOwner {
  return asset.owner ?? "JOINT";
}

export function matchesOwnerFilter(asset: Asset, filter: OwnerFilter): boolean {
  return filter === "ALL" || getAssetOwner(asset) === filter;
}
