import "server-only";
import { PortfolioSnapshot } from "@/lib/models/snapshot";
import {
  buildSnapshot,
  generateSeedHistory,
  toDateKey,
} from "@/lib/services/snapshot-service";
import { getAssetRepository, getSnapshotRepository } from "./index";

const SEED_HISTORY_DAYS = 90;

/** Record (or overwrite) today's snapshot from the current asset state. */
export async function captureTodaySnapshot(): Promise<void> {
  const assets = await getAssetRepository().list();
  await getSnapshotRepository().upsert(buildSnapshot(assets, toDateKey(new Date())));
}

/**
 * Return the full history, seeding demo history first if the store is
 * empty, and always refreshing today's point so the chart ends at the
 * live portfolio value.
 */
export async function listSnapshotsWithToday(): Promise<PortfolioSnapshot[]> {
  const snapshotRepo = getSnapshotRepository();
  const assets = await getAssetRepository().list();

  const existing = await snapshotRepo.list();
  if (existing.length === 0) {
    await snapshotRepo.replaceAll(generateSeedHistory(assets, SEED_HISTORY_DAYS));
  } else {
    await snapshotRepo.upsert(buildSnapshot(assets, toDateKey(new Date())));
  }

  return snapshotRepo.list();
}

/** Dev convenience: wipe history and reseed demo data (used by /api/assets/reset). */
export async function resetSnapshotHistory(): Promise<void> {
  const assets = await getAssetRepository().list();
  await getSnapshotRepository().replaceAll(generateSeedHistory(assets, SEED_HISTORY_DAYS));
}
