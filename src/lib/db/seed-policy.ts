import "server-only";

/**
 * Demo seeding is opt-in (`NEXUS_SEED=1`).
 *
 * It used to run automatically whenever a table came back empty, which is
 * indistinguishable from a real database that is merely unreachable: start
 * the server from the wrong directory (the file path is derived from
 * `process.cwd()` unless `NEXUS_DB_PATH` is set) and the app would happily
 * fill a brand-new file with demo assets. To the user that looks exactly
 * like "my real data was wiped and replaced with sample data".
 *
 * With seeding off, an empty database simply stays empty and the app shows
 * its onboarding/empty states — which is both honest and recoverable.
 * Explicit actions (`/api/assets/reset`, backup import) still write demo or
 * restored data regardless of this flag; they bypass it deliberately.
 */
export function shouldSeedDemoData(): boolean {
  return process.env.NEXUS_SEED === "1";
}
