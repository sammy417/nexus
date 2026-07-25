import "server-only";
import { isSqliteSupported } from "@/lib/db/client";
import type { AssetRepository } from "./asset-repository";
import { SqliteAssetRepository } from "./sqlite-asset-repository";
import { MockAssetRepository } from "./mock-asset-repository";
import type { SnapshotRepository } from "./snapshot-repository";
import { SqliteSnapshotRepository } from "./sqlite-snapshot-repository";
import { MockSnapshotRepository } from "./mock-snapshot-repository";
import type { DividendRepository } from "./dividend-repository";
import { SqliteDividendRepository } from "./sqlite-dividend-repository";
import { MockDividendRepository } from "./mock-dividend-repository";
import type { SettingsRepository } from "./settings-repository";
import { SqliteSettingsRepository } from "./sqlite-settings-repository";
import { MockSettingsRepository } from "./mock-settings-repository";

declare global {
  var __nexusAssetRepository: AssetRepository | undefined;
  var __nexusSnapshotRepository: SnapshotRepository | undefined;
  var __nexusDividendRepository: DividendRepository | undefined;
  var __nexusSettingsRepository: SettingsRepository | undefined;
  var __nexusSqliteFallbackWarned: boolean | undefined;
}

function isMockDataLayer(): boolean {
  if (process.env.DATA_LAYER === "mock") return true;
  if (!isSqliteSupported()) {
    if (!globalThis.__nexusSqliteFallbackWarned) {
      globalThis.__nexusSqliteFallbackWarned = true;
      console.warn(
        `[nexus] node:sqlite is unavailable on this Node.js runtime (${process.version}). ` +
          "Falling back to the in-memory data layer — data will NOT persist across restarts. " +
          "Upgrade to Node >= 22.13 to enable the SQLite file database."
      );
    }
    return true;
  }
  return false;
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

export function getDividendRepository(): DividendRepository {
  if (!globalThis.__nexusDividendRepository) {
    globalThis.__nexusDividendRepository = isMockDataLayer()
      ? new MockDividendRepository()
      : new SqliteDividendRepository();
  }
  return globalThis.__nexusDividendRepository;
}

export function getSettingsRepository(): SettingsRepository {
  if (!globalThis.__nexusSettingsRepository) {
    globalThis.__nexusSettingsRepository = isMockDataLayer()
      ? new MockSettingsRepository()
      : new SqliteSettingsRepository();
  }
  return globalThis.__nexusSettingsRepository;
}

export type { AssetRepository } from "./asset-repository";
export type { SnapshotRepository } from "./snapshot-repository";
export type { DividendRepository } from "./dividend-repository";
export type { SettingsRepository } from "./settings-repository";
