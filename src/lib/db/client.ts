import "server-only";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

/**
 * File-based SQLite database (via Node's built-in `node:sqlite`, no native
 * addon required). One `assets` table holds every asset type: shared
 * columns (id/type/name/timestamps) plus a `payload` JSON column for
 * type-specific fields, so adding a new asset type never requires a
 * migration — only a new case in the model/service layer.
 */

const DB_PATH = path.join(process.cwd(), "data", "nexus.db");

const globalForDb = globalThis as unknown as { __nexusDb?: DatabaseSync };

function createDb(): DatabaseSync {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const db = new DatabaseSync(DB_PATH);
  db.exec(`
    CREATE TABLE IF NOT EXISTS assets (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
  return db;
}

export function getDb(): DatabaseSync {
  if (!globalForDb.__nexusDb) {
    globalForDb.__nexusDb = createDb();
  }
  return globalForDb.__nexusDb;
}
