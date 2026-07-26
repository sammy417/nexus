import { Asset, AssetOwner, StockAsset } from "@/lib/models/asset";
import { getAssetOwner } from "@/lib/models/asset-owner";

export interface MergedPart {
  owner: AssetOwner;
  quantity: number;
  avgPrice: number;
}

/**
 * One display row of the portfolio table: either a real asset, or a
 * synthetic asset combining every position of the same listing with a
 * `merged` descriptor (read-only in the UI — edits go through the
 * individual rows in the unmerged view).
 */
export interface DisplayHolding {
  asset: Asset;
  merged?: { count: number; parts: MergedPart[] };
}

/** Prefix on the synthetic id of a merged (read-only) holding. */
export const MERGED_ID_PREFIX = "merged:";

/** Whether an asset is a synthetic merged holding (not a real, editable row). */
export function isMergedAsset(asset: Asset): boolean {
  return asset.id.startsWith(MERGED_ID_PREFIX);
}

export function toDisplayHoldings(assets: Asset[]): DisplayHolding[] {
  return assets.map((asset) => ({ asset }));
}

function mergeKey(asset: StockAsset): string {
  return `${asset.ticker!.trim().toUpperCase()}|${asset.currency ?? "KRW"}`;
}

/**
 * Merge stock positions that share a ticker (and currency) across
 * owners: quantities sum, the average price is position-weighted, and
 * the current price comes from the most recently updated row. Everything
 * else (no ticker, other asset types) passes through unchanged.
 */
export function mergeHoldings(assets: Asset[]): DisplayHolding[] {
  const groups = new Map<string, StockAsset[]>();
  for (const asset of assets) {
    if (asset.type === "STOCK" && asset.ticker?.trim()) {
      const key = mergeKey(asset);
      groups.set(key, [...(groups.get(key) ?? []), asset]);
    }
  }

  const emitted = new Set<string>();
  const holdings: DisplayHolding[] = [];

  for (const asset of assets) {
    if (asset.type === "STOCK" && asset.ticker?.trim()) {
      const key = mergeKey(asset);
      const group = groups.get(key)!;
      if (group.length > 1) {
        if (emitted.has(key)) continue;
        emitted.add(key);

        const quantity = group.reduce((sum, g) => sum + g.quantity, 0);
        const principal = group.reduce((sum, g) => sum + g.avgPrice * g.quantity, 0);
        const latest = [...group].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];

        holdings.push({
          asset: {
            ...latest,
            id: `${MERGED_ID_PREFIX}${key}`,
            quantity,
            avgPrice: principal / quantity,
            currentPrice: latest.currentPrice,
            owner: undefined,
          },
          merged: {
            count: group.length,
            parts: group.map((g) => ({
              owner: getAssetOwner(g),
              quantity: g.quantity,
              avgPrice: g.avgPrice,
            })),
          },
        });
        continue;
      }
    }
    holdings.push({ asset });
  }

  return holdings;
}
