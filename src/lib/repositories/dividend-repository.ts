import { DividendInput, DividendRecord } from "@/lib/models/dividend";

/** Persistence contract for dividend payout records. */
export interface DividendRepository {
  /** All records, newest payment date first. */
  list(): Promise<DividendRecord[]>;
  create(input: DividendInput): Promise<DividendRecord>;
  remove(id: string): Promise<boolean>;
  /** Dev convenience: wipe and reseed demo data. */
  reset(): Promise<DividendRecord[]>;
  /** Backup restore: wipe and insert the given records verbatim. */
  replaceAll(records: DividendRecord[]): Promise<void>;
}
