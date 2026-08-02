import "server-only";
import { PortfolioSnapshot } from "@/lib/models/snapshot";
import {
  buildSnapshot,
  generateSeedHistory,
  toDateKey,
} from "@/lib/services/snapshot-service";
import { DEFAULT_USD_KRW } from "@/lib/services/portfolio-service";
import { fetchUsdKrwRate } from "@/lib/services/quote-service";
import { shouldSeedDemoData } from "@/lib/db/seed-policy";
import { getAssetRepository, getSnapshotRepository } from "./index";

const SEED_HISTORY_DAYS = 90;

/** Live FX with an offline fallback — snapshots must never fail on a network error. */
async function getUsdKrwSafe(): Promise<number> {
  try {
    return await fetchUsdKrwRate();
  } catch {
    return DEFAULT_USD_KRW;
  }
}

/**
 * Record (or overwrite) today's snapshot from the current asset state.
 *
 * With demo seeding opted in (`NEXUS_SEED=1`), a completely empty history
 * store gets the full back-dated demo series instead so the trend chart has
 * something to draw. Without it, history simply starts accumulating from
 * today — fabricating 90 days of past values for a real portfolio would be
 * inventing data the user never had.
 */
export async function captureTodaySnapshot(): Promise<void> {
  const snapshotRepo = getSnapshotRepository();
  const assets = await getAssetRepository().list();
  const usdKrw = await getUsdKrwSafe();

  const existing = await snapshotRepo.list();
  if (existing.length === 0 && shouldSeedDemoData()) {
    await snapshotRepo.replaceAll(generateSeedHistory(assets, SEED_HISTORY_DAYS, usdKrw));
    return;
  }
  await snapshotRepo.upsert(buildSnapshot(assets, toDateKey(new Date()), usdKrw));
}

/** Full history, refreshing (or first-seeding) today's point first. */
export async function listSnapshotsWithToday(): Promise<PortfolioSnapshot[]> {
  await captureTodaySnapshot();
  return getSnapshotRepository().list();
}

/** Dev convenience: wipe history and reseed demo data (used by /api/assets/reset). */
export async function resetSnapshotHistory(): Promise<void> {
  const assets = await getAssetRepository().list();
  const usdKrw = await getUsdKrwSafe();
  await getSnapshotRepository().replaceAll(generateSeedHistory(assets, SEED_HISTORY_DAYS, usdKrw));
}
