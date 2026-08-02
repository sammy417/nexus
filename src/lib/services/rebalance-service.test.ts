import { describe, expect, it } from "vitest";
import { Asset } from "@/lib/models/asset";
import { PortfolioCategory } from "@/lib/models/portfolio-category";
import { TargetAllocationSettings, TargetWeights } from "@/lib/models/target-allocation";
import { getContributionPlan, getRebalancePlan } from "./rebalance-service";

const USD_KRW = 1000;

const base = { id: "a", name: "n", createdAt: "2026-01-01", updatedAt: "2026-01-01" };

function weights(partial: Partial<TargetWeights>): TargetWeights {
  return { STOCK_KR: 0, STOCK_FOREIGN: 0, BOND: 0, CASH: 0, PENSION: 0, CUSTOM: 0, ...partial };
}

function target(
  partial: Partial<TargetWeights>,
  over: Partial<TargetAllocationSettings> = {}
): TargetAllocationSettings {
  return {
    enabled: true,
    weights: weights(partial),
    bandPct: 5,
    excludeHome: false,
    ...over,
  };
}

function row(plan: ReturnType<typeof getRebalancePlan>, category: PortfolioCategory) {
  return plan.rows.find((r) => r.category === category)!;
}

/** A KRW cash position — the simplest way to place valuation in a sleeve. */
function cash(id: string, balance: number): Asset {
  return { ...base, id, type: "CASH", balance };
}

function krStock(id: string, valuation: number): Asset {
  return {
    ...base,
    id,
    type: "STOCK",
    market: "KOSPI",
    quantity: 1,
    avgPrice: 0,
    currentPrice: valuation,
  };
}

describe("getRebalancePlan", () => {
  it("reports each sleeve's current ratio, drift and the trade that closes it", () => {
    // 60/40 actual against a 50/50 target on a 10,000,000 portfolio.
    const plan = getRebalancePlan(
      [krStock("s", 6_000_000), cash("c", 4_000_000)],
      USD_KRW,
      target({ STOCK_KR: 50, CASH: 50 })
    );
    expect(plan.totalValuation).toBe(10_000_000);

    const stock = row(plan, "STOCK_KR");
    expect(stock.currentRatio).toBeCloseTo(60, 6);
    expect(stock.driftPct).toBeCloseTo(10, 6);
    expect(stock.targetValuation).toBe(5_000_000);
    // Positive delta = buy, negative = sell. Overweight stock must be sold.
    expect(stock.deltaValuation).toBe(-1_000_000);
    expect(row(plan, "CASH").deltaValuation).toBe(1_000_000);
  });

  it("applies the tighter of the absolute band and 25% of the target (5/25 rule)", () => {
    const plan = getRebalancePlan(
      [krStock("s", 1_000_000)],
      USD_KRW,
      target({ STOCK_KR: 10, CASH: 90 })
    );
    // 10% target → 2.5%p, tighter than the 5%p absolute band.
    expect(row(plan, "STOCK_KR").tolerancePct).toBeCloseTo(2.5, 6);
    // 90% target → 22.5%p, so the 5%p absolute band wins.
    expect(row(plan, "CASH").tolerancePct).toBe(5);
  });

  it("falls back to the absolute band for a sleeve targeted at 0%", () => {
    const plan = getRebalancePlan([cash("c", 1_000_000)], USD_KRW, target({ CASH: 100 }));
    expect(row(plan, "BOND").tolerancePct).toBe(5);
  });

  it("flags a sleeve only once the drift exceeds its own tolerance", () => {
    // 24%/76% against a 20%/80% target: 4%p drift on a 20% target (5%p band).
    const under = getRebalancePlan(
      [krStock("s", 2_400_000), cash("c", 7_600_000)],
      USD_KRW,
      target({ STOCK_KR: 20, CASH: 80 })
    );
    expect(row(under, "STOCK_KR").driftPct).toBeCloseTo(4, 6);
    expect(row(under, "STOCK_KR").outOfBand).toBe(false);
    expect(under.needsRebalancing).toBe(false);

    // 26%/74%: 6%p drift now clears the 5%p band.
    const over = getRebalancePlan(
      [krStock("s", 2_600_000), cash("c", 7_400_000)],
      USD_KRW,
      target({ STOCK_KR: 20, CASH: 80 })
    );
    expect(over.needsRebalancing).toBe(true);
    expect(over.maxAbsDrift).toBeCloseTo(6, 6);
  });

  it("has nothing to rebalance when the portfolio is empty", () => {
    const plan = getRebalancePlan([], USD_KRW, target({ STOCK_KR: 100 }));
    expect(plan.totalValuation).toBe(0);
    expect(plan.needsRebalancing).toBe(false);
    expect(plan.rows.every((r) => !r.outOfBand)).toBe(true);
  });

  it("leaves the primary residence out of the math when 집 제외 is on", () => {
    const home: Asset = {
      ...base,
      id: "home",
      type: "CUSTOM",
      purchasePrice: 900_000_000,
      currentValue: 900_000_000,
      isHome: true,
    };
    const assets = [home, krStock("s", 5_000_000), cash("c", 5_000_000)];

    const included = getRebalancePlan(assets, USD_KRW, target({ STOCK_KR: 50, CASH: 50 }));
    expect(included.totalValuation).toBe(910_000_000);
    expect(included.excludedHomeValuation).toBe(0);

    const excluded = getRebalancePlan(
      assets,
      USD_KRW,
      target({ STOCK_KR: 50, CASH: 50 }, { excludeHome: true })
    );
    expect(excluded.totalValuation).toBe(10_000_000);
    expect(excluded.excludedHomeValuation).toBe(900_000_000);
    // Without the home dominating the denominator the portfolio is on target.
    expect(excluded.needsRebalancing).toBe(false);
  });

  it("still counts non-home custom assets when 집 제외 is on", () => {
    const gold: Asset = {
      ...base,
      id: "gold",
      type: "CUSTOM",
      purchasePrice: 5_000_000,
      currentValue: 5_000_000,
    };
    const plan = getRebalancePlan(
      [gold, cash("c", 5_000_000)],
      USD_KRW,
      target({ CASH: 100 }, { excludeHome: true })
    );
    expect(plan.excludedHomeValuation).toBe(0);
    expect(row(plan, "CUSTOM").currentValuation).toBe(5_000_000);
  });
});

describe("getContributionPlan", () => {
  const plan = getRebalancePlan(
    [krStock("s", 6_000_000), cash("c", 4_000_000)],
    USD_KRW,
    target({ STOCK_KR: 50, CASH: 50 })
  );

  it("directs new cash to the underweight sleeve only — nothing is sold", () => {
    const rows = getContributionPlan(plan, 2_000_000);
    expect(rows.map((r) => r.category)).toEqual(["CASH"]);
    expect(rows[0].amount).toBe(2_000_000);
  });

  it("splits across sleeves in proportion to their shortfall", () => {
    // 10,000,000 all in stock; target 50/25/25 over stock/bond/cash.
    const skewed = getRebalancePlan(
      [krStock("s", 10_000_000)],
      USD_KRW,
      target({ STOCK_KR: 50, BOND: 25, CASH: 25 })
    );
    const rows = getContributionPlan(skewed, 10_000_000);
    const byCategory = Object.fromEntries(rows.map((r) => [r.category, r.amount]));
    // Post-contribution total 20,000,000 → bond and cash each need 5,000,000.
    expect(byCategory.BOND).toBeCloseTo(5_000_000, 6);
    expect(byCategory.CASH).toBeCloseTo(5_000_000, 6);
    expect(byCategory.STOCK_KR).toBeUndefined();
  });

  it("allocates exactly the contribution, no more and no less", () => {
    const rows = getContributionPlan(plan, 3_333_333);
    expect(rows.reduce((sum, r) => sum + r.amount, 0)).toBeCloseTo(3_333_333, 6);
  });

  it("orders the rows by amount so the biggest buy is first", () => {
    const skewed = getRebalancePlan(
      [krStock("s", 10_000_000)],
      USD_KRW,
      target({ STOCK_KR: 50, BOND: 40, CASH: 10 })
    );
    const rows = getContributionPlan(skewed, 10_000_000);
    expect(rows.map((r) => r.category)).toEqual(["BOND", "CASH"]);
  });

  it("has nothing to suggest without new money", () => {
    expect(getContributionPlan(plan, 0)).toEqual([]);
    expect(getContributionPlan(plan, -1_000_000)).toEqual([]);
  });

  it("has nothing to suggest when no sleeve has a target to grow into", () => {
    // Degenerate all-zero target (nothing configured): no shortfall anywhere,
    // so the new cash is left unassigned rather than spread arbitrarily.
    const noTarget = getRebalancePlan([krStock("s", 10_000_000)], USD_KRW, target({}));
    expect(getContributionPlan(noTarget, 1_000_000)).toEqual([]);
  });

  it("always finds somewhere to put new money while the weights sum to 100", () => {
    // Even a portfolio sitting exactly on target has room: the contribution
    // raises the denominator, so every sleeve's target valuation grows.
    const onTarget = getRebalancePlan(
      [krStock("s", 5_000_000), cash("c", 5_000_000)],
      USD_KRW,
      target({ STOCK_KR: 50, CASH: 50 })
    );
    const rows = getContributionPlan(onTarget, 1_000_000);
    expect(rows.map((r) => r.amount)).toEqual([500_000, 500_000]);
  });
});
