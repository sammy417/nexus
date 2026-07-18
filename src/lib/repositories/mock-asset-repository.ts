import { randomUUID } from "node:crypto";
import { Asset, AssetInput } from "@/lib/models/asset";
import { SEED_ASSETS } from "@/lib/models/seed-data";
import type { AssetRepository } from "./asset-repository";

function toAsset(input: AssetInput, id: string, createdAt: string, updatedAt: string): Asset {
  return { ...input, id, createdAt, updatedAt } as Asset;
}

/**
 * Pure in-memory repository — no filesystem access. Useful for tests,
 * storybook-style component demos, or running the app with `DATA_LAYER=mock`
 * when SQLite isn't wanted (data resets every process restart).
 */
export class MockAssetRepository implements AssetRepository {
  private assets: Asset[];

  constructor(seed: AssetInput[] = SEED_ASSETS) {
    const now = new Date().toISOString();
    this.assets = seed.map((input) => toAsset(input, randomUUID(), now, now));
  }

  async list(): Promise<Asset[]> {
    return [...this.assets];
  }

  async get(id: string): Promise<Asset | null> {
    return this.assets.find((asset) => asset.id === id) ?? null;
  }

  async create(input: AssetInput): Promise<Asset> {
    const now = new Date().toISOString();
    const asset = toAsset(input, randomUUID(), now, now);
    this.assets = [...this.assets, asset];
    return asset;
  }

  async update(id: string, input: AssetInput): Promise<Asset | null> {
    const index = this.assets.findIndex((asset) => asset.id === id);
    if (index === -1) return null;
    const updated = toAsset(input, id, this.assets[index].createdAt, new Date().toISOString());
    this.assets = [...this.assets.slice(0, index), updated, ...this.assets.slice(index + 1)];
    return updated;
  }

  async remove(id: string): Promise<boolean> {
    const before = this.assets.length;
    this.assets = this.assets.filter((asset) => asset.id !== id);
    return this.assets.length < before;
  }

  async reset(): Promise<Asset[]> {
    const now = new Date().toISOString();
    this.assets = SEED_ASSETS.map((input) => toAsset(input, randomUUID(), now, now));
    return this.list();
  }
}
