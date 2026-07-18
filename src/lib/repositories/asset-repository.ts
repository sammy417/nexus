import { Asset, AssetInput } from "@/lib/models/asset";

/**
 * Persistence contract for assets. Swappable behind `getAssetRepository()`
 * (see `./index.ts`) so the rest of the app never talks to SQLite or any
 * other storage directly.
 */
export interface AssetRepository {
  list(): Promise<Asset[]>;
  get(id: string): Promise<Asset | null>;
  create(input: AssetInput): Promise<Asset>;
  update(id: string, input: AssetInput): Promise<Asset | null>;
  remove(id: string): Promise<boolean>;
  /** Dev convenience: wipe all assets and reseed with demo data. */
  reset(): Promise<Asset[]>;
}
