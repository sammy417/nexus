import "server-only";
import fs from "node:fs";
import path from "node:path";
import type { DatabaseSync } from "node:sqlite";

/**
 * File-based SQLite database (via Node's built-in `node:sqlite`, no native
 * addon required). One `assets` table holds every asset type: shared
 * columns (id/type/name/timestamps) plus a `payload` JSON column for
 * type-specific fields, so adding a new asset type never requires a
 * migration — only a new case in the model/service layer.
 *
 * `node:sqlite` is loaded lazily via `process.getBuiltinModule` (never a
 * static import): the module only exists unflagged on Node >= 22.13, and a
 * static import would crash the whole server at module-load time on older
 * runtimes. `isSqliteSupported()` lets the repository factory fall back to
 * the in-memory data layer instead.
 *
 * `NEXUS_DB_PATH` overrides the database file. Without it the path is
 * derived from `process.cwd()`, which means starting the server from a
 * different directory silently opens a *different* (empty) database —
 * indistinguishable from "my data disappeared". Point tests and throwaway
 * runs at their own file instead of sharing the real one.
 */

function resolveDbPath(): string {
  const override = process.env.NEXUS_DB_PATH?.trim();
  if (override) return path.resolve(override);
  return path.join(process.cwd(), "data", "nexus.db");
}

/** Absolute path of the database file this process is using. */
export function getDbPath(): string {
  return resolveDbPath();
}

const globalForDb = globalThis as unknown as { __nexusDb?: DatabaseSync };

type SqliteModule = { DatabaseSync: typeof DatabaseSync };

function loadSqliteModule(): SqliteModule | null {
  try {
    return (process.getBuiltinModule?.("node:sqlite") as SqliteModule | undefined) ?? null;
  } catch {
    return null;
  }
}

export function isSqliteSupported(): boolean {
  return loadSqliteModule() !== null;
}

function createDb(): DatabaseSync {
  const sqlite = loadSqliteModule();
  if (!sqlite) {
    throw new Error(
      `node:sqlite is not available on this Node.js runtime (${process.version}); Node >= 22.13 is required for the SQLite data layer`
    );
  }
  const dbPath = resolveDbPath();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new sqlite.DatabaseSync(dbPath);
  db.exec(`
    CREATE TABLE IF NOT EXISTS assets (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS snapshots (
      date TEXT PRIMARY KEY,
      total_principal REAL NOT NULL,
      total_valuation REAL NOT NULL,
      by_type TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS dividends (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT,
      date TEXT NOT NULL,
      memo TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Idempotent migrations: add columns to databases created before they
  // existed. ALTER fails if the column is already there, so the error is
  // expected and ignored.
  for (const migration of [
    "ALTER TABLE snapshots ADD COLUMN by_owner TEXT",
    "ALTER TABLE dividends ADD COLUMN owner TEXT",
  ]) {
    try {
      db.exec(migration);
    } catch {
      // column already present
    }
  }

  return db;
}

export function getDb(): DatabaseSync {
  if (!globalForDb.__nexusDb) {
    globalForDb.__nexusDb = createDb();
  }
  return globalForDb.__nexusDb;
}
