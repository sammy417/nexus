import { PortfolioSnapshot } from "@/lib/models/snapshot";

/** Persistence contract for daily portfolio snapshots (one row per date). */
export interface SnapshotRepository {
  /** All snapshots, oldest first. */
  list(): Promise<PortfolioSnapshot[]>;
  /** Insert or overwrite the snapshot for its date. */
  upsert(snapshot: PortfolioSnapshot): Promise<void>;
  /** Wipe all snapshots and replace with the given history. */
  replaceAll(snapshots: PortfolioSnapshot[]): Promise<void>;
}
