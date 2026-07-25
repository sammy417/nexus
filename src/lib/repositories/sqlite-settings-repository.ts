import "server-only";
import { getDb } from "@/lib/db/client";
import { AppSettings, DEFAULT_SETTINGS, normalizeSettings } from "@/lib/models/settings";
import type { SettingsRepository } from "./settings-repository";

const KEY = "app";

export class SqliteSettingsRepository implements SettingsRepository {
  async get(): Promise<AppSettings> {
    const row = getDb().prepare("SELECT value FROM settings WHERE key = ?").get(KEY) as
      | { value: string }
      | undefined;
    if (!row) return DEFAULT_SETTINGS;
    try {
      return normalizeSettings(JSON.parse(row.value));
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  async save(settings: AppSettings): Promise<AppSettings> {
    getDb()
      .prepare(
        "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
      )
      .run(KEY, JSON.stringify(settings));
    return settings;
  }
}
