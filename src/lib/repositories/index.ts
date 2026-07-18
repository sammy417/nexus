import "server-only";
import type { AssetRepository } from "./asset-repository";
import { SqliteAssetRepository } from "./sqlite-asset-repository";
import { MockAssetRepository } from "./mock-asset-repository";
import type { SnapshotRepository } from "./snapshot-repository";
import { SqliteSnapshotRepository } from "./sqlite-snapshot-repository";
import { MockSnapshotRepository } from "./mock-snapshot-repository";

declare global {
  var __nexusAssetRepository: AssetRepository | undefined;
  var __nexusSnapshotRepository: SnapshotRepository | undefined;
}

function isMockDataLayer(): boolean {
  return process.env.DATA_LAYER === "mock";
}

/**
 * Data layer entry point. Everything server-side (API routes, server
 * actions) should call this instead of importing a repository directly,
 * so storage can be swapped by setting `DATA_LAYER=mock` (or later,
 * pointing at a different backend) without touching call sites.
 */
export function getAssetRepository(): AssetRepository {
  if (!globalThis.__nexusAssetRepository) {
    globalThis.__nexusAssetRepository = isMockDataLayer()
      ? new MockAssetRepository()
      : new SqliteAssetRepository();
  }
  return globalThis.__nexusAssetRepository;
}

export function getSnapshotRepository(): SnapshotRepository {
  if (!globalThis.__nexusSnapshotRepository) {
    globalThis.__nexusSnapshotRepository = isMockDataLayer()
      ? new MockSnapshotRepository()
      : new SqliteSnapshotRepository();
  }
  return globalThis.__nexusSnapshotRepository;
}

export type { AssetRepository } from "./asset-repository";
export type { SnapshotRepository } from "./snapshot-repository";
