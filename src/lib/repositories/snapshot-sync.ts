import "server-only";
import { PortfolioSnapshot } from "@/lib/models/snapshot";
import {
  buildSnapshot,
  generateSeedHistory,
  toDateKey,
} from "@/lib/services/snapshot-service";
import { getAssetRepository, getSnapshotRepository } from "./index";

const SEED_HISTORY_DAYS = 90;

/**
 * Record (or overwrite) today's snapshot from the current asset state.
 * On a completely empty history store this seeds the full demo history
 * instead (which also ends at today's live value) — the check lives here,
 * not in the list path, so it holds no matter whether the first-ever
 * request is a read or an asset mutation.
 */
export async function captureTodaySnapshot(): Promise<void> {
  const snapshotRepo = getSnapshotRepository();
  const assets = await getAssetRepository().list();

  const existing = await snapshotRepo.list();
  if (existing.length === 0) {
    await snapshotRepo.replaceAll(generateSeedHistory(assets, SEED_HISTORY_DAYS));
    return;
  }
  await snapshotRepo.upsert(buildSnapshot(assets, toDateKey(new Date())));
}

/** Full history, refreshing (or first-seeding) today's point first. */
export async function listSnapshotsWithToday(): Promise<PortfolioSnapshot[]> {
  await captureTodaySnapshot();
  return getSnapshotRepository().list();
}

/** Dev convenience: wipe history and reseed demo data (used by /api/assets/reset). */
export async function resetSnapshotHistory(): Promise<void> {
  const assets = await getAssetRepository().list();
  await getSnapshotRepository().replaceAll(generateSeedHistory(assets, SEED_HISTORY_DAYS));
}
