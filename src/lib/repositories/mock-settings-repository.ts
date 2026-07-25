import { AppSettings, DEFAULT_SETTINGS } from "@/lib/models/settings";
import type { SettingsRepository } from "./settings-repository";

export class MockSettingsRepository implements SettingsRepository {
  private settings: AppSettings = DEFAULT_SETTINGS;

  async get(): Promise<AppSettings> {
    return this.settings;
  }

  async save(settings: AppSettings): Promise<AppSettings> {
    this.settings = settings;
    return settings;
  }
}
