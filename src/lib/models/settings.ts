import { AssetOwner } from "./asset";
import { ASSET_OWNER_LABEL, ASSET_OWNERS, OWNER_COLOR } from "./asset-owner";
import {
  DEFAULT_TARGET_ALLOCATION,
  normalizeTargetAllocation,
  TargetAllocationSettings,
} from "./target-allocation";
import { normalizeTaxInputsByYear, TaxInputsByYear } from "./tax-inputs";
import { normalizeRetirementByScope, RetirementInputsByScope } from "./retirement";
import { Goal, normalizeGoals } from "./goal";

/** Household-level preferences (one shared dataset, so not per-user). */
export interface AppSettings {
  /** Custom display names for each owner tag (본인/배우자/자녀/공동 by default). */
  ownerNames: Record<AssetOwner, string>;
  /** Custom hex colors (badge text/dot/donut) for each owner tag. */
  ownerColors: Record<AssetOwner, string>;
  /** Target asset allocation + drift band driving the rebalancing card. */
  targetAllocation: TargetAllocationSettings;
  /** Manual tax-page figures, keyed by year then owner. */
  taxInputs: TaxInputsByYear;
  /** Retirement-plan inputs, keyed by owner filter. */
  retirementInputs: RetirementInputsByScope;
  /** Dated savings goals with the assets earmarked toward each. */
  goals: Goal[];
}

export const DEFAULT_SETTINGS: AppSettings = {
  ownerNames: { ...ASSET_OWNER_LABEL },
  ownerColors: { ...OWNER_COLOR },
  targetAllocation: {
    ...DEFAULT_TARGET_ALLOCATION,
    weights: { ...DEFAULT_TARGET_ALLOCATION.weights },
  },
  taxInputs: {},
  retirementInputs: {},
  goals: [],
};

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/** Keep only well-formed `#rgb`/`#rrggbb` values; fall back otherwise. */
function normalizeHex(value: unknown, fallback: string): string {
  return typeof value === "string" && HEX_RE.test(value.trim()) ? value.trim() : fallback;
}

/** Coerce an unknown stored/imported value into a complete AppSettings. */
export function normalizeSettings(value: unknown): AppSettings {
  const ownerNames: Record<AssetOwner, string> = { ...DEFAULT_SETTINGS.ownerNames };
  const ownerColors: Record<AssetOwner, string> = { ...DEFAULT_SETTINGS.ownerColors };
  if (value && typeof value === "object") {
    const rawNames = (value as { ownerNames?: unknown }).ownerNames;
    if (rawNames && typeof rawNames === "object") {
      for (const owner of ASSET_OWNERS) {
        const name = (rawNames as Record<string, unknown>)[owner];
        if (typeof name === "string" && name.trim().length > 0) {
          ownerNames[owner] = name.trim();
        }
      }
    }
    const rawColors = (value as { ownerColors?: unknown }).ownerColors;
    if (rawColors && typeof rawColors === "object") {
      for (const owner of ASSET_OWNERS) {
        ownerColors[owner] = normalizeHex(
          (rawColors as Record<string, unknown>)[owner],
          DEFAULT_SETTINGS.ownerColors[owner]
        );
      }
    }
  }
  const isObject = value !== null && typeof value === "object";
  const targetAllocation = normalizeTargetAllocation(
    isObject ? (value as { targetAllocation?: unknown }).targetAllocation : undefined
  );
  const taxInputs = normalizeTaxInputsByYear(
    isObject ? (value as { taxInputs?: unknown }).taxInputs : undefined
  );
  const retirementInputs = normalizeRetirementByScope(
    isObject ? (value as { retirementInputs?: unknown }).retirementInputs : undefined
  );
  const goals = normalizeGoals(isObject ? (value as { goals?: unknown }).goals : undefined);
  return { ownerNames, ownerColors, targetAllocation, taxInputs, retirementInputs, goals };
}
