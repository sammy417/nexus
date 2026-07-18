import { randomUUID } from "node:crypto";
import { DividendInput, DividendRecord } from "@/lib/models/dividend";
import { getSeedDividends } from "@/lib/models/seed-dividends";
import type { DividendRepository } from "./dividend-repository";

function toRecord(input: DividendInput): DividendRecord {
  const now = new Date().toISOString();
  return { ...input, id: randomUUID(), createdAt: now, updatedAt: now };
}

/** In-memory dividend store for DATA_LAYER=mock (resets on process restart). */
export class MockDividendRepository implements DividendRepository {
  private records: DividendRecord[] = getSeedDividends().map(toRecord);

  async list(): Promise<DividendRecord[]> {
    return [...this.records].sort((a, b) => b.date.localeCompare(a.date));
  }

  async create(input: DividendInput): Promise<DividendRecord> {
    const record = toRecord(input);
    this.records = [...this.records, record];
    return record;
  }

  async remove(id: string): Promise<boolean> {
    const before = this.records.length;
    this.records = this.records.filter((record) => record.id !== id);
    return this.records.length < before;
  }

  async reset(): Promise<DividendRecord[]> {
    this.records = getSeedDividends().map(toRecord);
    return this.list();
  }
}
