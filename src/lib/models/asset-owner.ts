import { Asset, AssetOwner } from "./asset";

export const ASSET_OWNERS: AssetOwner[] = ["SELF", "SPOUSE", "CHILD", "JOINT"];

/** Default display names; overridable per household in settings. */
export const ASSET_OWNER_LABEL: Record<AssetOwner, string> = {
  SELF: "본인",
  SPOUSE: "배우자",
  CHILD: "자녀",
  JOINT: "공동",
};

/**
 * Default owner hex colors — a validated 4-slot palette that reads on both
 * light and dark surfaces. Overridable per household in settings; used for
 * donut/legend, dots, and tinted badges (text = hue, bg = hue at low alpha).
 */
export const OWNER_COLOR: Record<AssetOwner, string> = {
  SELF: "#3182F6",
  SPOUSE: "#c9548a",
  CHILD: "#1baf7a",
  JOINT: "#c98500",
};

/** `#rgb`/`#rrggbb` → `rgba(r,g,b,alpha)`, for tinted badge backgrounds. */
export function hexWithAlpha(hex: string, alpha: number): string {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return hex;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Filter value: a specific owner or the combined household view. */
export type OwnerFilter = AssetOwner | "ALL";

export function getAssetOwner(asset: Asset): AssetOwner {
  return asset.owner ?? "JOINT";
}

export function matchesOwnerFilter(asset: Asset, filter: OwnerFilter): boolean {
  return filter === "ALL" || getAssetOwner(asset) === filter;
}
