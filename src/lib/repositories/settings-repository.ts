import { AppSettings } from "@/lib/models/settings";

/** Persistence contract for the single household settings blob. */
export interface SettingsRepository {
  get(): Promise<AppSettings>;
  /** Replace settings with the given (already normalized) value. */
  save(settings: AppSettings): Promise<AppSettings>;
}
