import { AssetOwner, Currency } from "./asset";

/**
 * A dividend (or interest) payment event. Deliberately not foreign-keyed
 * to an asset id: payouts can arrive from positions that were later sold,
 * so the security name is stored as entered.
 */
export interface DividendRecord {
  id: string;
  /** Security/account the payout came from, e.g. "삼성전자". */
  name: string;
  /** Amount in `currency` (undefined = KRW). */
  amount: number;
  currency?: Currency;
  /** Household owner of the payout. undefined = "JOINT". */
  owner?: AssetOwner;
  /** Payment date, YYYY-MM-DD. */
  date: string;
  memo?: string;
  createdAt: string;
  updatedAt: string;
}

export type DividendInput = Omit<DividendRecord, "id" | "createdAt" | "updatedAt">;

/** Korean dividend/interest withholding (14% income + 1.4% local). */
export const DIVIDEND_TAX_RATE = 0.154;

/** Minimal runtime shape check for API request bodies. */
export function isValidDividendInput(value: unknown): value is DividendInput {
  if (!value || typeof value !== "object") return false;
  const input = value as Record<string, unknown>;
  if (typeof input.name !== "string" || input.name.trim().length === 0) return false;
  if (typeof input.amount !== "number" || !Number.isFinite(input.amount) || input.amount <= 0)
    return false;
  if (input.currency !== undefined && input.currency !== "KRW" && input.currency !== "USD")
    return false;
  if (
    input.owner !== undefined &&
    input.owner !== "SELF" &&
    input.owner !== "SPOUSE" &&
    input.owner !== "JOINT"
  ) {
    return false;
  }
  if (typeof input.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(input.date)) return false;
  if (input.memo !== undefined && typeof input.memo !== "string") return false;
  return true;
}
