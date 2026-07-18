import { PortfolioSnapshot } from "@/lib/models/snapshot";
import type { SnapshotRepository } from "./snapshot-repository";

/** In-memory snapshot store for DATA_LAYER=mock (resets on process restart). */
export class MockSnapshotRepository implements SnapshotRepository {
  private snapshots = new Map<string, PortfolioSnapshot>();

  async list(): Promise<PortfolioSnapshot[]> {
    return [...this.snapshots.values()].sort((a, b) => a.date.localeCompare(b.date));
  }

  async upsert(snapshot: PortfolioSnapshot): Promise<void> {
    this.snapshots.set(snapshot.date, snapshot);
  }

  async replaceAll(snapshots: PortfolioSnapshot[]): Promise<void> {
    this.snapshots = new Map(snapshots.map((snapshot) => [snapshot.date, snapshot]));
  }
}
