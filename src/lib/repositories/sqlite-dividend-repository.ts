import "server-only";
import { randomUUID } from "node:crypto";
import { getDb } from "@/lib/db/client";
import { DividendInput, DividendRecord } from "@/lib/models/dividend";
import { getSeedDividends } from "@/lib/models/seed-dividends";
import type { DividendRepository } from "./dividend-repository";

interface DividendRow {
  id: string;
  name: string;
  amount: number;
  currency: string | null;
  date: string;
  memo: string | null;
  created_at: string;
  updated_at: string;
}

function rowToRecord(row: DividendRow): DividendRecord {
  return {
    id: row.id,
    name: row.name,
    amount: row.amount,
    currency: row.currency === "USD" ? "USD" : undefined,
    date: row.date,
    memo: row.memo ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SqliteDividendRepository implements DividendRepository {
  private seeded = false;

  private ensureSeeded(): void {
    if (this.seeded) return;
    this.seeded = true;
    const { count } = getDb()
      .prepare("SELECT COUNT(*) as count FROM dividends")
      .get() as { count: number };
    if (count > 0) return;
    for (const input of getSeedDividends()) {
      this.insert(input);
    }
  }

  private insert(input: DividendInput): DividendRecord {
    const id = randomUUID();
    const now = new Date().toISOString();
    getDb()
      .prepare(
        "INSERT INTO dividends (id, name, amount, currency, date, memo, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
      )
      .run(
        id,
        input.name,
        input.amount,
        input.currency ?? null,
        input.date,
        input.memo ?? null,
        now,
        now
      );
    return { ...input, id, createdAt: now, updatedAt: now };
  }

  async list(): Promise<DividendRecord[]> {
    this.ensureSeeded();
    const rows = getDb()
      .prepare("SELECT * FROM dividends ORDER BY date DESC, created_at DESC")
      .all() as unknown as DividendRow[];
    return rows.map(rowToRecord);
  }

  async create(input: DividendInput): Promise<DividendRecord> {
    this.ensureSeeded();
    return this.insert(input);
  }

  async remove(id: string): Promise<boolean> {
    this.ensureSeeded();
    const result = getDb().prepare("DELETE FROM dividends WHERE id = ?").run(id);
    return result.changes > 0;
  }

  async reset(): Promise<DividendRecord[]> {
    getDb().exec("DELETE FROM dividends");
    this.seeded = false;
    this.ensureSeeded();
    return this.list();
  }
}
