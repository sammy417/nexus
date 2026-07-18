import { DividendRecord } from "@/lib/models/dividend";

/** Amount of one record in KRW. */
export function dividendToKrw(record: DividendRecord, usdKrw: number): number {
  return record.currency === "USD" ? record.amount * usdKrw : record.amount;
}

export interface MonthlyDividend {
  /** YYYY-MM */
  month: string;
  /** e.g. "5월" */
  label: string;
  totalKrw: number;
}

/** The trailing 12 calendar months (including the current one), zero-filled. */
export function getMonthlyDividends(records: DividendRecord[], usdKrw: number): MonthlyDividend[] {
  const byMonth = new Map<string, number>();
  for (const record of records) {
    const month = record.date.slice(0, 7);
    byMonth.set(month, (byMonth.get(month) ?? 0) + dividendToKrw(record, usdKrw));
  }

  const months: MonthlyDividend[] = [];
  const cursor = new Date();
  cursor.setUTCDate(1);
  cursor.setUTCMonth(cursor.getUTCMonth() - 11);
  for (let i = 0; i < 12; i++) {
    const key = cursor.toISOString().slice(0, 7);
    months.push({
      month: key,
      label: `${Number(key.slice(5))}월`,
      totalKrw: byMonth.get(key) ?? 0,
    });
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return months;
}

export interface DividendSummary {
  thisYearKrw: number;
  trailing12mKrw: number;
  monthlyAverageKrw: number;
  thisMonthKrw: number;
}

export function getDividendSummary(records: DividendRecord[], usdKrw: number): DividendSummary {
  const now = new Date();
  const thisYear = String(now.getUTCFullYear());
  const thisMonth = now.toISOString().slice(0, 7);
  const monthly = getMonthlyDividends(records, usdKrw);
  const trailing12mKrw = monthly.reduce((sum, m) => sum + m.totalKrw, 0);

  return {
    thisYearKrw: records
      .filter((r) => r.date.startsWith(thisYear))
      .reduce((sum, r) => sum + dividendToKrw(r, usdKrw), 0),
    trailing12mKrw,
    monthlyAverageKrw: trailing12mKrw / 12,
    thisMonthKrw: monthly.find((m) => m.month === thisMonth)?.totalKrw ?? 0,
  };
}
