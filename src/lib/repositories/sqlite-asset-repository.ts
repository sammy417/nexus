import "server-only";
import { randomUUID } from "node:crypto";
import { getDb } from "@/lib/db/client";
import { shouldSeedDemoData } from "@/lib/db/seed-policy";
import { Asset, AssetInput } from "@/lib/models/asset";
import { SEED_ASSETS } from "@/lib/models/seed-data";
import type { AssetRepository } from "./asset-repository";

interface AssetRow {
  id: string;
  type: string;
  name: string;
  payload: string;
  created_at: string;
  updated_at: string;
}

function rowToAsset(row: AssetRow): Asset {
  const payload = JSON.parse(row.payload) as Record<string, unknown>;
  return {
    ...payload,
    id: row.id,
    type: row.type,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  } as Asset;
}

/** Only the type-specific fields (and optional memo) go into the JSON blob. */
function toPayload(input: AssetInput): string {
  const { name: _name, type: _type, ...rest } = input;
  return JSON.stringify(rest);
}

export class SqliteAssetRepository implements AssetRepository {
  private seeded = false;

  /** Write the demo set. Callers decide whether seeding is appropriate. */
  private seedDemoData(): void {
    for (const input of SEED_ASSETS) {
      this.insert(input);
    }
  }

  /**
   * Fill an empty database with demo assets — only when explicitly opted in
   * (`NEXUS_SEED=1`). An empty table otherwise means "no assets yet", not
   * "please invent some": auto-seeding a database the app failed to find is
   * indistinguishable from wiping the real one.
   */
  private ensureSeeded(): void {
    if (this.seeded) return;
    this.seeded = true;
    if (!shouldSeedDemoData()) return;
    const db = getDb();
    const { count } = db.prepare("SELECT COUNT(*) as count FROM assets").get() as {
      count: number;
    };
    if (count > 0) return;
    this.seedDemoData();
  }

  private insert(input: AssetInput): Asset {
    const db = getDb();
    const id = randomUUID();
    const now = new Date().toISOString();
    const payload = toPayload(input);
    db.prepare(
      "INSERT INTO assets (id, type, name, payload, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(id, input.type, input.name, payload, now, now);
    return rowToAsset({ id, type: input.type, name: input.name, payload, created_at: now, updated_at: now });
  }

  async list(): Promise<Asset[]> {
    this.ensureSeeded();
    const rows = getDb().prepare("SELECT * FROM assets ORDER BY created_at ASC").all() as unknown as AssetRow[];
    return rows.map(rowToAsset);
  }

  async get(id: string): Promise<Asset | null> {
    this.ensureSeeded();
    const row = getDb().prepare("SELECT * FROM assets WHERE id = ?").get(id) as
      | AssetRow
      | undefined;
    return row ? rowToAsset(row) : null;
  }

  async create(input: AssetInput): Promise<Asset> {
    this.ensureSeeded();
    return this.insert(input);
  }

  async update(id: string, input: AssetInput): Promise<Asset | null> {
    this.ensureSeeded();
    const db = getDb();
    const existing = db.prepare("SELECT * FROM assets WHERE id = ?").get(id) as
      | AssetRow
      | undefined;
    if (!existing) return null;

    const now = new Date().toISOString();
    const payload = toPayload(input);
    db.prepare("UPDATE assets SET type = ?, name = ?, payload = ?, updated_at = ? WHERE id = ?").run(
      input.type,
      input.name,
      payload,
      now,
      id
    );
    return rowToAsset({ ...existing, type: input.type, name: input.name, payload, updated_at: now });
  }

  async remove(id: string): Promise<boolean> {
    this.ensureSeeded();
    const result = getDb().prepare("DELETE FROM assets WHERE id = ?").run(id);
    return result.changes > 0;
  }

  /** Explicit user action, so it restores demo data regardless of `NEXUS_SEED`. */
  async reset(): Promise<Asset[]> {
    getDb().exec("DELETE FROM assets");
    this.seeded = true;
    this.seedDemoData();
    return this.list();
  }

  async replaceAll(assets: Asset[]): Promise<void> {
    const db = getDb();
    db.exec("DELETE FROM assets");
    const stmt = db.prepare(
      "INSERT INTO assets (id, type, name, payload, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
    );
    for (const asset of assets) {
      const { id, type, name, createdAt, updatedAt, ...rest } = asset;
      stmt.run(id, type, name, JSON.stringify(rest), createdAt, updatedAt);
    }
    // Non-empty restore counts as seeded so demo data never re-appends.
    this.seeded = assets.length > 0;
  }
}
