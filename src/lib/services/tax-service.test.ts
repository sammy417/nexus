import { describe, expect, it } from "vitest";
import { Asset, StockAsset } from "@/lib/models/asset";
import { DividendRecord } from "@/lib/models/dividend";
import {
  FINANCIAL_INCOME_THRESHOLD_KRW,
  FOREIGN_CGT_EXEMPTION_KRW,
  PENSION_COMBINED_CREDIT_LIMIT_KRW,
  PENSION_CREDIT_RATE_HIGH_INCOME,
  PENSION_CREDIT_RATE_LOW_INCOME,
  PENSION_SAVINGS_CREDIT_LIMIT_KRW,
} from "@/lib/models/tax";
import {
  getCapitalGainsSummary,
  getFinancialIncomeSummary,
  getForeignStockLots,
  getPensionCredit,
  getYearEndDividendProjection,
} from "./tax-service";

const USD_KRW = 1000;

function stock(over: Partial<StockAsset> & { name: string }): StockAsset {
  return {
    id: over.name,
    type: "STOCK",
    quantity: 1,
    avgPrice: 100,
    currentPrice: 100,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...over,
  };
}

function dividend(over: Partial<DividendRecord> & { name: string; amount: number; date: string }): DividendRecord {
  return {
    id: `${over.name}-${over.date}`,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...over,
  };
}

const thisYear = new Date().getUTCFullYear();

describe("getCapitalGainsSummary", () => {
  it("taxes nothing while the combined gain stays under the annual exemption", () => {
    const s = getCapitalGainsSummary(1_000_000, [1_000_000]);
    expect(s.totalGainKrw).toBe(2_000_000);
    expect(s.taxableGainKrw).toBe(0);
    expect(s.estimatedTaxKrw).toBe(0);
  });

  it("applies the exemption once to the combined total, not to each part", () => {
    // Split across two parts that are each under 250만 but together exceed it.
    const s = getCapitalGainsSummary(2_000_000, [2_000_000]);
    expect(s.totalGainKrw).toBe(4_000_000);
    expect(s.taxableGainKrw).toBe(4_000_000 - FOREIGN_CGT_EXEMPTION_KRW);
    expect(s.estimatedTaxKrw).toBeCloseTo(1_500_000 * 0.22, 6);
  });

  it("lets an already-realized loss offset a later gain", () => {
    // The scenario verified by hand: -300만 realized, +595.7만 if sold today.
    const s = getCapitalGainsSummary(-3_000_000, [5_957_000]);
    expect(s.totalGainKrw).toBe(2_957_000);
    expect(s.taxableGainKrw).toBe(457_000);
    expect(s.estimatedTaxKrw).toBeCloseTo(100_540, 6);
  });

  it("separates tax already owed from the marginal tax of selling more", () => {
    const s = getCapitalGainsSummary(5_000_000, [5_957_000]);
    // 500만 alone already burns the exemption: (500만 − 250만) × 22%.
    expect(s.taxOnRealizedOnlyKrw).toBeCloseTo(550_000, 6);
    expect(s.estimatedTaxKrw).toBeCloseTo((10_957_000 - 2_500_000) * 0.22, 6);
    expect(s.additionalTaxKrw).toBeCloseTo(s.estimatedTaxKrw - s.taxOnRealizedOnlyKrw, 6);
  });

  it("never reports negative tax when the year is a net loss", () => {
    const s = getCapitalGainsSummary(-5_000_000, [-1_000_000]);
    expect(s.totalGainKrw).toBe(-6_000_000);
    expect(s.taxableGainKrw).toBe(0);
    expect(s.estimatedTaxKrw).toBe(0);
    expect(s.taxOnRealizedOnlyKrw).toBe(0);
  });

  it("reports remaining exemption from realized gains only, floored at zero", () => {
    expect(getCapitalGainsSummary(1_000_000, []).exemptionRemainingKrw).toBe(1_500_000);
    expect(getCapitalGainsSummary(9_000_000, []).exemptionRemainingKrw).toBe(0);
    // A realized loss does not create extra exemption room.
    expect(getCapitalGainsSummary(-9_000_000, []).exemptionRemainingKrw).toBe(
      FOREIGN_CGT_EXEMPTION_KRW
    );
  });
});

describe("getForeignStockLots", () => {
  it("includes only foreign-listed holdings — domestic gains are out of scope", () => {
    const assets: Asset[] = [
      stock({ name: "삼성전자", market: "KOSPI", ticker: "005930", quantity: 10, avgPrice: 60_000, currentPrice: 70_000 }),
      stock({ name: "엔비디아", market: "NASDAQ", ticker: "NVDA", currency: "USD", quantity: 10, avgPrice: 100, currentPrice: 150 }),
    ];
    const lots = getForeignStockLots(assets, USD_KRW);
    expect(lots.map((l) => l.asset.name)).toEqual(["엔비디아"]);
  });

  it("reports unrealized P&L converted to KRW", () => {
    const assets: Asset[] = [
      stock({ name: "엔비디아", market: "NASDAQ", ticker: "NVDA", currency: "USD", quantity: 10, avgPrice: 100, currentPrice: 150 }),
    ];
    const [lot] = getForeignStockLots(assets, USD_KRW);
    expect(lot.valuationKrw).toBe(10 * 150 * USD_KRW);
    expect(lot.profitKrw).toBe(10 * 50 * USD_KRW);
  });
});

describe("getFinancialIncomeSummary", () => {
  const records = [
    dividend({ name: "삼성전자", amount: 5_000_000, date: `${thisYear}-03-01` }),
    dividend({ name: "지난해", amount: 90_000_000, date: `${thisYear - 1}-12-31` }),
  ];

  it("counts only this calendar year's records", () => {
    const s = getFinancialIncomeSummary(records, USD_KRW);
    expect(s.recordedThisYearKrw).toBe(5_000_000);
  });

  it("converts USD records at the given rate", () => {
    const s = getFinancialIncomeSummary(
      [dividend({ name: "AAPL", amount: 1_000, currency: "USD", date: `${thisYear}-03-01` })],
      USD_KRW
    );
    expect(s.recordedThisYearKrw).toBe(1_000_000);
  });

  it("adds the manual adjustment and the projection on top", () => {
    const s = getFinancialIncomeSummary(records, USD_KRW, 2_000_000, 1_000_000);
    expect(s.currentIncomeKrw).toBe(7_000_000);
    expect(s.projectedYearEndKrw).toBe(8_000_000);
  });

  it("flags the threshold separately for today and for the year-end projection", () => {
    const nearly = [dividend({ name: "X", amount: 19_000_000, date: `${thisYear}-03-01` })];
    const s = getFinancialIncomeSummary(nearly, USD_KRW, 0, 2_000_000);
    expect(s.currentOverThreshold).toBe(false);
    expect(s.currentExcessKrw).toBe(0);
    expect(s.projectedOverThreshold).toBe(true);
    expect(s.projectedExcessKrw).toBe(21_000_000 - FINANCIAL_INCOME_THRESHOLD_KRW);
  });

  it("ignores negative adjustments instead of subtracting income", () => {
    const s = getFinancialIncomeSummary(records, USD_KRW, -1_000_000, -1_000_000);
    expect(s.manualAdjustmentKrw).toBe(0);
    expect(s.currentIncomeKrw).toBe(5_000_000);
    expect(s.projectedRemainingKrw).toBe(0);
  });
});

describe("getPensionCredit", () => {
  it("caps 연금저축 at its own limit before combining with IRP", () => {
    // 800만 into 연금저축 only counts as 600만; +200만 IRP → 800만 eligible.
    const r = getPensionCredit(8_000_000, 2_000_000, true);
    expect(r.eligibleSavingsKrw).toBe(PENSION_SAVINGS_CREDIT_LIMIT_KRW);
    expect(r.eligibleCombinedKrw).toBe(8_000_000);
  });

  it("caps the combined contribution at the shared limit", () => {
    const r = getPensionCredit(6_000_000, 9_000_000, true);
    expect(r.eligibleCombinedKrw).toBe(PENSION_COMBINED_CREDIT_LIMIT_KRW);
    expect(r.remainingRoomKrw).toBe(0);
  });

  it("uses the income-dependent credit rate", () => {
    expect(getPensionCredit(9_000_000, 0, true).creditRate).toBe(PENSION_CREDIT_RATE_LOW_INCOME);
    expect(getPensionCredit(9_000_000, 0, false).creditRate).toBe(PENSION_CREDIT_RATE_HIGH_INCOME);
  });

  it("computes the credit from the eligible amount, not the raw contribution", () => {
    // 600만 + 300만 = 900만 eligible × 16.5% — the hand-checked figure.
    const r = getPensionCredit(6_000_000, 3_000_000, true);
    expect(r.estimatedCreditKrw).toBeCloseTo(1_485_000, 6);
  });

  it("reports remaining room under the combined limit", () => {
    const r = getPensionCredit(2_000_000, 1_000_000, true);
    expect(r.remainingRoomKrw).toBe(PENSION_COMBINED_CREDIT_LIMIT_KRW - 3_000_000);
  });

  it("treats negative input as zero", () => {
    const r = getPensionCredit(-1_000_000, -500_000, true);
    expect(r.eligibleCombinedKrw).toBe(0);
    expect(r.estimatedCreditKrw).toBe(0);
  });
});

describe("getYearEndDividendProjection", () => {
  /** Minimal shape of what the forecast service hands us. */
  function holding(over: { nextExDateEstimate: string | null; nextAmountKrw: number | null; frequencyPerYear: number }) {
    return {
      assetId: "a",
      name: "n",
      ticker: "T",
      owner: "SELF" as const,
      quantity: 1,
      currency: "KRW",
      valuationKrw: 0,
      perShareTrailing12m: 0,
      perShareLast: 0,
      yieldPct: null,
      annualEstimateKrw: 0,
      lastExDate: null,
      ...over,
    };
  }

  it("counts every remaining payout up to Dec 31", () => {
    // Quarterly (≈91-day interval) starting Oct 1 → Oct 1 and Dec 31 land in-year.
    const total = getYearEndDividendProjection([
      holding({ nextExDateEstimate: `${thisYear}-10-01`, nextAmountKrw: 1_000, frequencyPerYear: 4 }),
    ]);
    expect(total).toBe(2_000);
  });

  it("returns zero once the next payout falls into next year", () => {
    const total = getYearEndDividendProjection([
      holding({ nextExDateEstimate: `${thisYear + 1}-01-15`, nextAmountKrw: 1_000, frequencyPerYear: 4 }),
    ]);
    expect(total).toBe(0);
  });

  it("skips holdings with no usable estimate", () => {
    const total = getYearEndDividendProjection([
      holding({ nextExDateEstimate: null, nextAmountKrw: 1_000, frequencyPerYear: 4 }),
      holding({ nextExDateEstimate: `${thisYear}-12-01`, nextAmountKrw: null, frequencyPerYear: 4 }),
      holding({ nextExDateEstimate: `${thisYear}-12-01`, nextAmountKrw: 1_000, frequencyPerYear: 0 }),
    ]);
    expect(total).toBe(0);
  });
});
