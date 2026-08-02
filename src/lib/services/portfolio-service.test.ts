import { describe, expect, it } from "vitest";
import { Asset } from "@/lib/models/asset";
import {
  getAllocationByCategory,
  getAllocationByOwner,
  getAllocationByType,
  getAssetMetrics,
  getPortfolioSummary,
} from "./portfolio-service";

/**
 * `getAssetMetrics` is the foundation every other calculation stands on —
 * a wrong principal/valuation here propagates into the portfolio total, the
 * rebalance drift and the tax simulators alike.
 */

const USD_KRW = 1000;

const base = { id: "a", name: "n", createdAt: "2026-01-01", updatedAt: "2026-01-01" };

describe("getAssetMetrics", () => {
  it("prices a stock as quantity × price on both legs", () => {
    const m = getAssetMetrics(
      { ...base, type: "STOCK", quantity: 10, avgPrice: 1_000, currentPrice: 1_500 },
      USD_KRW
    );
    expect(m.principal).toBe(10_000);
    expect(m.valuation).toBe(15_000);
    expect(m.profit).toBe(5_000);
    expect(m.profitRate).toBeCloseTo(50, 6);
  });

  it("treats cash as principal = valuation, so it never shows a profit", () => {
    const m = getAssetMetrics({ ...base, type: "CASH", balance: 3_000_000 }, USD_KRW);
    expect(m.principal).toBe(3_000_000);
    expect(m.valuation).toBe(3_000_000);
    expect(m.profit).toBe(0);
    expect(m.profitRate).toBe(0);
  });

  it("uses purchase/current value for bonds, pensions and custom assets", () => {
    const bond = getAssetMetrics(
      { ...base, type: "BOND", purchasePrice: 1_000_000, currentValue: 1_050_000 },
      USD_KRW
    );
    const pension = getAssetMetrics(
      { ...base, type: "PENSION", principalPaid: 1_000_000, currentValue: 900_000 },
      USD_KRW
    );
    const custom = getAssetMetrics(
      { ...base, type: "CUSTOM", purchasePrice: 1_000_000, currentValue: 2_000_000 },
      USD_KRW
    );
    expect(bond.profit).toBe(50_000);
    expect(pension.profit).toBe(-100_000);
    expect(custom.profitRate).toBeCloseTo(100, 6);
  });

  it("converts USD-denominated assets at the given rate", () => {
    const m = getAssetMetrics(
      {
        ...base,
        type: "STOCK",
        currency: "USD",
        quantity: 10,
        avgPrice: 100,
        currentPrice: 150,
      },
      USD_KRW
    );
    expect(m.principal).toBe(10 * 100 * USD_KRW);
    expect(m.valuation).toBe(10 * 150 * USD_KRW);
    // The rate cancels out of the ratio — FX moves don't change the return %.
    expect(m.profitRate).toBeCloseTo(50, 6);
  });

  it("reports a 0% return rather than dividing by a zero principal", () => {
    const m = getAssetMetrics(
      { ...base, type: "STOCK", quantity: 10, avgPrice: 0, currentPrice: 100 },
      USD_KRW
    );
    expect(m.profit).toBe(1_000);
    expect(m.profitRate).toBe(0);
  });
});

describe("getPortfolioSummary", () => {
  const assets: Asset[] = [
    { ...base, id: "1", type: "CASH", balance: 1_000_000 },
    { ...base, id: "2", type: "STOCK", quantity: 10, avgPrice: 100_000, currentPrice: 150_000 },
  ];

  it("sums both legs and derives the return from the combined principal", () => {
    const s = getPortfolioSummary(assets, USD_KRW);
    expect(s.totalPrincipal).toBe(2_000_000);
    expect(s.totalValuation).toBe(2_500_000);
    expect(s.totalProfit).toBe(500_000);
    expect(s.totalProfitRate).toBeCloseTo(25, 6);
  });

  it("returns zeros for an empty portfolio instead of NaN", () => {
    const s = getPortfolioSummary([], USD_KRW);
    expect(s.totalValuation).toBe(0);
    expect(s.totalProfitRate).toBe(0);
  });
});

describe("allocation breakdowns", () => {
  const assets: Asset[] = [
    { ...base, id: "1", type: "CASH", balance: 2_500_000, owner: "SELF" },
    {
      ...base,
      id: "2",
      type: "STOCK",
      market: "KOSPI",
      quantity: 1,
      avgPrice: 0,
      currentPrice: 2_500_000,
      owner: "SPOUSE",
    },
    {
      ...base,
      id: "3",
      type: "STOCK",
      market: "NASDAQ",
      currency: "USD",
      quantity: 1,
      avgPrice: 0,
      currentPrice: 5_000,
      // no owner → JOINT
    },
  ];

  it("splits stocks into Korean and foreign categories", () => {
    const byCategory = getAllocationByCategory(assets, USD_KRW);
    expect(byCategory.map((e) => e.category)).toEqual(["STOCK_KR", "STOCK_FOREIGN", "CASH"]);
    expect(byCategory.find((e) => e.category === "STOCK_FOREIGN")?.valuation).toBe(5_000_000);
  });

  it("keeps both stocks together when grouping by asset type", () => {
    const byType = getAllocationByType(assets, USD_KRW);
    expect(byType.find((e) => e.type === "STOCK")?.valuation).toBe(7_500_000);
    expect(byType.find((e) => e.type === "STOCK")?.ratio).toBeCloseTo(75, 6);
  });

  it("treats an untagged asset as JOINT", () => {
    const byOwner = getAllocationByOwner(assets, USD_KRW);
    expect(byOwner.find((e) => e.owner === "JOINT")?.valuation).toBe(5_000_000);
  });

  it("omits empty buckets and leaves the ratios summing to 100", () => {
    for (const entries of [
      getAllocationByType(assets, USD_KRW),
      getAllocationByCategory(assets, USD_KRW),
      getAllocationByOwner(assets, USD_KRW),
    ]) {
      expect(entries.every((e) => e.valuation > 0)).toBe(true);
      expect(entries.reduce((sum, e) => sum + e.ratio, 0)).toBeCloseTo(100, 6);
    }
  });

  it("returns nothing at all for an empty portfolio", () => {
    expect(getAllocationByType([], USD_KRW)).toEqual([]);
    expect(getAllocationByCategory([], USD_KRW)).toEqual([]);
    expect(getAllocationByOwner([], USD_KRW)).toEqual([]);
  });
});
