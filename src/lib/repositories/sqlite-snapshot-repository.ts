import "server-only";
import { getDb } from "@/lib/db/client";
import { PortfolioSnapshot } from "@/lib/models/snapshot";
import type { SnapshotRepository } from "./snapshot-repository";

interface SnapshotRow {
  date: string;
  total_principal: number;
  total_valuation: number;
  by_type: string;
}

function rowToSnapshot(row: SnapshotRow): PortfolioSnapshot {
  return {
    date: row.date,
    totalPrincipal: row.total_principal,
    totalValuation: row.total_valuation,
    byType: JSON.parse(row.by_type),
  };
}

export class SqliteSnapshotRepository implements SnapshotRepository {
  async list(): Promise<PortfolioSnapshot[]> {
    const rows = getDb()
      .prepare("SELECT * FROM snapshots ORDER BY date ASC")
      .all() as unknown as SnapshotRow[];
    return rows.map(rowToSnapshot);
  }

  async upsert(snapshot: PortfolioSnapshot): Promise<void> {
    getDb()
      .prepare(
        `INSERT INTO snapshots (date, total_principal, total_valuation, by_type)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(date) DO UPDATE SET
           total_principal = excluded.total_principal,
           total_valuation = excluded.total_valuation,
           by_type = excluded.by_type`
      )
      .run(
        snapshot.date,
        snapshot.totalPrincipal,
        snapshot.totalValuation,
        JSON.stringify(snapshot.byType)
      );
  }

  async replaceAll(snapshots: PortfolioSnapshot[]): Promise<void> {
    getDb().exec("DELETE FROM snapshots");
    for (const snapshot of snapshots) {
      await this.upsert(snapshot);
    }
  }
}
