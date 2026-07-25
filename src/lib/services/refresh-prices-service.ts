import "server-only";
import { AssetInput } from "@/lib/models/asset";
import { getAssetRepository } from "@/lib/repositories";
import { captureTodaySnapshot } from "@/lib/repositories/snapshot-sync";
import { fetchQuoteKrw } from "./quote-service";

export interface RefreshPricesResult {
  /** Stock holdings whose current price actually changed. */
  updated: number;
  /** Held stock tickers that were re-quoted (updated + unchanged). */
  checked: number;
  /** "이름 (티커)" of holdings whose lookup failed. */
  failed: string[];
  refreshedAt: string;
}

/**
 * Re-quote every stock holding with a ticker and write back the current
 * price in the asset's own currency (mirrors how the form stores it, so
 * KRW vs USD stays consistent). One snapshot is captured afterwards if
 * anything moved. Per-ticker failures are collected, never fatal.
 */
export async function refreshAllPrices(): Promise<RefreshPricesResult> {
  const repo = getAssetRepository();
  const assets = await repo.list();

  let updated = 0;
  let checked = 0;
  const failed: string[] = [];

  for (const asset of assets) {
    if (asset.type !== "STOCK" || !asset.ticker?.trim()) continue;
    checked += 1;
    try {
      const quote = await fetchQuoteKrw(asset.ticker.trim(), asset.market);
      const nextPrice = (asset.currency ?? "KRW") === "USD" ? quote.price : quote.priceKrw;
      if (nextPrice > 0 && nextPrice !== asset.currentPrice) {
        const { id, createdAt: _c, updatedAt: _u, ...input } = asset;
        await repo.update(id, { ...input, currentPrice: nextPrice } as AssetInput);
        updated += 1;
      }
    } catch {
      failed.push(`${asset.name} (${asset.ticker})`);
    }
  }

  if (updated > 0) {
    await captureTodaySnapshot();
  }

  return { updated, checked, failed, refreshedAt: new Date().toISOString() };
}
