import { AssetOwner } from "./asset";
import { ASSET_OWNER_LABEL, ASSET_OWNERS } from "./asset-owner";

/** Household-level preferences (one shared dataset, so not per-user). */
export interface AppSettings {
  /** Custom display names for each owner tag (본인/배우자/자녀/공동 by default). */
  ownerNames: Record<AssetOwner, string>;
}

export const DEFAULT_SETTINGS: AppSettings = {
  ownerNames: { ...ASSET_OWNER_LABEL },
};

/** Coerce an unknown stored/imported value into a complete AppSettings. */
export function normalizeSettings(value: unknown): AppSettings {
  const ownerNames: Record<AssetOwner, string> = { ...DEFAULT_SETTINGS.ownerNames };
  if (value && typeof value === "object") {
    const raw = (value as { ownerNames?: unknown }).ownerNames;
    if (raw && typeof raw === "object") {
      for (const owner of ASSET_OWNERS) {
        const name = (raw as Record<string, unknown>)[owner];
        if (typeof name === "string" && name.trim().length > 0) {
          ownerNames[owner] = name.trim();
        }
      }
    }
  }
  return { ownerNames };
}
