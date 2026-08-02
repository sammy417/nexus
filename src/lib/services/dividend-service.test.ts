import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { DividendRecord } from "@/lib/models/dividend";
import { dividendToKrw, getDividendSummary, getMonthlyDividends } from "./dividend-service";

const USD_KRW = 1000;

/**
 * The monthly buckets are relative to "now", so the clock is pinned. Mid-May
 * keeps the trailing window straddling a year boundary (2025-06 … 2026-05),
 * which is where the year-to-date and trailing-12m figures disagree.
 */
const NOW = new Date("2026-05-15T00:00:00.000Z");

beforeAll(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterAll(() => {
  vi.useRealTimers();
});

function record(over: Partial<DividendRecord> & { date: string; amount: number }): DividendRecord {
  return {
    id: over.date + over.amount,
    name: "삼성전자",
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
    ...over,
  };
}

describe("dividendToKrw", () => {
  it("converts USD payouts and leaves KRW ones alone", () => {
    expect(dividendToKrw(record({ date: "2026-05-01", amount: 100, currency: "USD" }), USD_KRW)).toBe(
      100_000
    );
    expect(dividendToKrw(record({ date: "2026-05-01", amount: 100 }), USD_KRW)).toBe(100);
    // No currency stored = KRW, so pre-currency records need no migration.
    expect(dividendToKrw(record({ date: "2026-05-01", amount: 100, currency: "KRW" }), USD_KRW)).toBe(
      100
    );
  });
});

describe("getMonthlyDividends", () => {
  it("returns the trailing 12 months ending with the current one", () => {
    const months = getMonthlyDividends([], USD_KRW);
    expect(months).toHaveLength(12);
    expect(months[0].month).toBe("2025-06");
    expect(months[11].month).toBe("2026-05");
  });

  it("zero-fills months with no payout", () => {
    const months = getMonthlyDividends([record({ date: "2026-05-10", amount: 50_000 })], USD_KRW);
    expect(months.every((m) => m.totalKrw === 0 || m.month === "2026-05")).toBe(true);
    expect(months[11].totalKrw).toBe(50_000);
  });

  it("sums every payout that lands in the same month, converting as it goes", () => {
    const months = getMonthlyDividends(
      [
        record({ date: "2026-03-01", amount: 10_000 }),
        record({ date: "2026-03-31", amount: 20_000 }),
        record({ date: "2026-03-15", amount: 30, currency: "USD" }),
      ],
      USD_KRW
    );
    expect(months.find((m) => m.month === "2026-03")?.totalKrw).toBe(60_000);
  });

  it("drops payouts older than the window", () => {
    const months = getMonthlyDividends(
      [
        record({ date: "2025-05-31", amount: 99_999_999 }),
        record({ date: "2025-06-01", amount: 1_000 }),
      ],
      USD_KRW
    );
    expect(months.reduce((sum, m) => sum + m.totalKrw, 0)).toBe(1_000);
  });

  it("labels each bucket with its Korean month name", () => {
    const months = getMonthlyDividends([], USD_KRW);
    expect(months[0].label).toBe("6월");
    expect(months[11].label).toBe("5월");
  });
});

describe("getDividendSummary", () => {
  const records = [
    record({ date: "2025-12-20", amount: 4_000_000 }), // last year, still in window
    record({ date: "2026-02-10", amount: 1_000_000 }),
    record({ date: "2026-05-10", amount: 2_000_000 }),
    record({ date: "2024-05-10", amount: 9_000_000 }), // outside the window entirely
  ];

  it("counts this calendar year separately from the trailing 12 months", () => {
    const s = getDividendSummary(records, USD_KRW);
    expect(s.thisYearKrw).toBe(3_000_000);
    expect(s.trailing12mKrw).toBe(7_000_000);
  });

  it("averages the trailing total over 12 months, including the empty ones", () => {
    const s = getDividendSummary(records, USD_KRW);
    expect(s.monthlyAverageKrw).toBeCloseTo(7_000_000 / 12, 6);
  });

  it("reports the current month on its own", () => {
    expect(getDividendSummary(records, USD_KRW).thisMonthKrw).toBe(2_000_000);
  });

  it("returns zeros with no records at all", () => {
    const s = getDividendSummary([], USD_KRW);
    expect(s.thisYearKrw).toBe(0);
    expect(s.trailing12mKrw).toBe(0);
    expect(s.monthlyAverageKrw).toBe(0);
    expect(s.thisMonthKrw).toBe(0);
  });
});
