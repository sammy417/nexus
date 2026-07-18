import "server-only";
import type { AssetRepository } from "./asset-repository";
import { SqliteAssetRepository } from "./sqlite-asset-repository";
import { MockAssetRepository } from "./mock-asset-repository";

declare global {
  var __nexusAssetRepository: AssetRepository | undefined;
}

/**
 * Data layer entry point. Everything server-side (API routes, server
 * actions) should call this instead of importing a repository directly,
 * so storage can be swapped by setting `DATA_LAYER=mock` (or later,
 * pointing at a different backend) without touching call sites.
 */
export function getAssetRepository(): AssetRepository {
  if (!globalThis.__nexusAssetRepository) {
    globalThis.__nexusAssetRepository =
      process.env.DATA_LAYER === "mock" ? new MockAssetRepository() : new SqliteAssetRepository();
  }
  return globalThis.__nexusAssetRepository;
}

export type { AssetRepository } from "./asset-repository";
