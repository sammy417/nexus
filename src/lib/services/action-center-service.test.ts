import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Asset, AssetOwner } from "@/lib/models/asset";
import { DividendRecord } from "@/lib/models/dividend";
import { TargetAllocationSettings, TargetWeights } from "@/lib/models/target-allocation";
import { getActionItems, ActionCenterInput } from "./action-center-service";
// type-only: the service module itself is server-only
import type { HoldingDividendForecast } from "./dividend-forecast-service";

/**
 * The action center is pure ranking on top of the other services, so what's
 * worth pinning down is *which* items surface and *in what order* — the
 * underlying figures are covered by the tax/rebalance suites.
 *
 * Several branches are calendar-gated (year-end housekeeping, the 14-day
 * dividend horizon), so the clock is pinned rather than left to run.
 */

const USD_KRW = 1000;
const MID_YEAR = new Date("2026-05-15T00:00:00.000Z");
const YEAR_END = new Date("2026-11-15T00:00:00.000Z");

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(MID_YEAR);
});

afterEach(() => {
  vi.useRealTimers();
});

const base = { createdAt: "2026-01-01", updatedAt: "2026-01-01" };

function weights(partial: Partial<TargetWeights>): TargetWeights {
  return { STOCK_KR: 0, STOCK_FOREIGN: 0, BOND: 0, CASH: 0, PENSION: 0, CUSTOM: 0, ...partial };
}

function target(
  partial: Partial<TargetWeights>,
  over: Partial<TargetAllocationSettings> = {}
): TargetAllocationSettings {
  return { enabled: true, weights: weights(partial), bandPct: 5, excludeHome: false, ...over };
}

function krStock(id: string, valuation: number, owner?: AssetOwner): Asset {
  return {
    ...base,
    id,
    name: id,
    type: "STOCK",
    market: "KOSPI",
    quantity: 1,
    avgPrice: 0,
    currentPrice: valuation,
    owner,
  };
}

function foreignStock(id: string, avgPrice: number, currentPrice: number, owner: AssetOwner): Asset {
  return {
    ...base,
    id,
    name: id,
    type: "STOCK",
    market: "NASDAQ",
    quantity: 1,
    avgPrice,
    currentPrice,
    owner,
  };
}

function dividend(amount: number, owner: AssetOwner, date = "2026-03-01"): DividendRecord {
  return { ...base, id: `${owner}-${date}-${amount}`, name: "배당", amount, owner, date };
}

function forecast(over: Partial<HoldingDividendForecast>): HoldingDividendForecast {
  return {
    assetId: "f",
    name: "종목",
    ticker: "T",
    owner: "SELF",
    quantity: 1,
    currency: "KRW",
    valuationKrw: 0,
    perShareTrailing12m: 0,
    perShareLast: 0,
    yieldPct: null,
    annualEstimateKrw: 0,
    frequencyPerYear: 4,
    lastExDate: null,
    nextExDateEstimate: null,
    nextAmountKrw: null,
    ...over,
  };
}

function input(over: Partial<ActionCenterInput> = {}): ActionCenterInput {
  return {
    scopedAssets: [],
    allAssets: [],
    dividends: [],
    forecastHoldings: [],
    usdKrw: USD_KRW,
    targetAllocation: target({ CASH: 100 }),
    ...over,
  };
}

describe("getActionItems — allocation drift", () => {
  /** Everything in Korean stocks against an evenly-spread five-sleeve target. */
  const badlySkewed = input({
    scopedAssets: [krStock("s", 10_000_000)],
    targetAllocation: target({
      STOCK_KR: 20,
      STOCK_FOREIGN: 20,
      BOND: 20,
      CASH: 20,
      PENSION: 20,
    }),
  });

  it("caps drift items so they can't bury the deadline-bound ones", () => {
    // All five sleeves are out of band; only the three worst are surfaced.
    const rebalance = getActionItems(badlySkewed).filter((i) => i.category === "REBALANCE");
    expect(rebalance).toHaveLength(3);
  });

  it("surfaces the worst drift first and points at the rebalance card", () => {
    const [first] = getActionItems(badlySkewed).filter((i) => i.category === "REBALANCE");
    expect(first.id).toBe("rebalance:STOCK_KR");
    expect(first.params?.drift).toBe("80.0");
    // A plain "/" link is a no-op on the dashboard itself.
    expect(first.href).toBe("/#rebalance");
  });

  it("distinguishes a mild drift from one at double the band", () => {
    const mild = getActionItems(
      input({
        // 56/44 against 50/50: 6%p drift on a 5%p band — over, but not double.
        scopedAssets: [krStock("s", 5_600_000), { ...base, id: "c", name: "c", type: "CASH", balance: 4_400_000 }],
        targetAllocation: target({ STOCK_KR: 50, CASH: 50 }),
      })
    );
    expect(mild.map((i) => i.severity)).toEqual(["INFO", "INFO"]);
    expect(getActionItems(badlySkewed)[0].severity).toBe("ATTENTION");
  });

  it("says nothing about drift when no target is set", () => {
    const items = getActionItems(
      input({
        scopedAssets: [krStock("s", 10_000_000)],
        targetAllocation: target({ CASH: 100 }, { enabled: false }),
      })
    );
    expect(items).toEqual([]);
  });

  it("phrases the item as a sell for an overweight sleeve and a buy for an underweight one", () => {
    const items = getActionItems(badlySkewed).filter((i) => i.category === "REBALANCE");
    expect(items[0].title).toContain("매도");
    expect(items[1].title).toContain("매수");
  });
});

describe("getActionItems — per-owner financial income", () => {
  const assets = [krStock("self", 1_000_000, "SELF"), krStock("spouse", 1_000_000, "SPOUSE")];

  it("raises an urgent item once the threshold is already crossed", () => {
    const items = getActionItems(
      input({ allAssets: assets, dividends: [dividend(25_000_000, "SELF")] })
    );
    const item = items.find((i) => i.id === "tax:income-over:SELF");
    expect(item?.severity).toBe("URGENT");
    expect(item?.params?.excess).toBe(5_000_000);
    expect(item?.href).toBe("/tax");
  });

  it("warns while the income is merely close to the threshold", () => {
    const items = getActionItems(
      input({ allAssets: assets, dividends: [dividend(18_000_000, "SELF")] })
    );
    const item = items.find((i) => i.id === "tax:income-near:SELF");
    expect(item?.severity).toBe("ATTENTION");
    expect(item?.params?.remaining).toBe(2_000_000);
  });

  it("warns about a projection that crosses even when today's total doesn't", () => {
    const items = getActionItems(
      input({
        allAssets: assets,
        dividends: [dividend(10_000_000, "SELF")],
        forecastHoldings: [forecast({ owner: "SELF", nextAmountKrw: 15_000_000 })],
      })
    );
    expect(items.find((i) => i.id === "tax:income-projected:SELF")?.severity).toBe("ATTENTION");
  });

  it("keeps each household member's income separate — tax is per person", () => {
    // 15,000,000 each: nobody crosses, even though the household sums to 30M.
    const items = getActionItems(
      input({
        allAssets: assets,
        dividends: [dividend(15_000_000, "SELF"), dividend(15_000_000, "SPOUSE")],
      })
    );
    expect(items.filter((i) => i.category === "TAX")).toEqual([]);
  });

  it("never raises a tax item for the JOINT bucket", () => {
    const items = getActionItems(
      input({
        allAssets: [krStock("joint", 1_000_000)],
        dividends: [{ ...base, id: "d", name: "배당", amount: 30_000_000, date: "2026-03-01" }],
      })
    );
    expect(items).toEqual([]);
  });

  it("ignores last year's payouts", () => {
    const items = getActionItems(
      input({ allAssets: assets, dividends: [dividend(30_000_000, "SELF", "2025-12-31")] })
    );
    expect(items).toEqual([]);
  });
});

describe("getActionItems — year-end housekeeping", () => {
  const yearEndInput = input({
    allAssets: [
      foreignStock("gain", 100, 200, "SELF"),
      foreignStock("loss", 200, 100, "SELF"),
      { ...base, id: "irp", name: "IRP", type: "PENSION", principalPaid: 1, currentValue: 1, owner: "SELF" },
    ],
  });

  it("stays quiet outside the year-end window", () => {
    expect(getActionItems(yearEndInput)).toEqual([]);
  });

  describe("in November", () => {
    beforeEach(() => {
      vi.setSystemTime(YEAR_END);
    });

    it("points out the unused capital-gains exemption while gains remain", () => {
      const item = getActionItems(yearEndInput).find((i) => i.id === "tax:cgt-exemption:SELF");
      expect(item?.severity).toBe("ATTENTION");
      expect(item?.owner).toBe("SELF");
    });

    it("counts the loss-harvest candidates", () => {
      const item = getActionItems(yearEndInput).find((i) => i.id === "tax:harvest:SELF");
      expect(item?.severity).toBe("INFO");
      expect(item?.params?.count).toBe(1);
    });

    it("reminds about pension contribution room only when the member holds one", () => {
      expect(getActionItems(yearEndInput).some((i) => i.id === "pension:room:SELF")).toBe(true);
      const noPension = input({ allAssets: [foreignStock("gain", 100, 200, "SELF")] });
      expect(getActionItems(noPension).some((i) => i.category === "PENSION")).toBe(false);
    });

    it("says nothing about domestic holdings — 양도세 is a foreign-stock rule", () => {
      const domestic = input({ allAssets: [krStock("kr", 1_000_000, "SELF")] });
      expect(getActionItems(domestic)).toEqual([]);
    });
  });
});

describe("getActionItems — upcoming dividends", () => {
  it("surfaces a payout inside the 14-day horizon", () => {
    const items = getActionItems(
      input({
        forecastHoldings: [
          forecast({ assetId: "a", name: "리얼티인컴", nextExDateEstimate: "2026-05-22", nextAmountKrw: 30_000 }),
        ],
      })
    );
    expect(items).toHaveLength(1);
    expect(items[0].category).toBe("DIVIDEND");
    expect(items[0].params).toMatchObject({ name: "리얼티인컴", amount: 30_000, days: 7 });
    expect(items[0].href).toBe("/dividends");
  });

  it("ignores payouts beyond the horizon or already past", () => {
    const items = getActionItems(
      input({
        forecastHoldings: [
          forecast({ assetId: "far", nextExDateEstimate: "2026-06-30", nextAmountKrw: 30_000 }),
          forecast({ assetId: "past", nextExDateEstimate: "2026-05-14", nextAmountKrw: 30_000 }),
        ],
      })
    );
    expect(items).toEqual([]);
  });

  it("skips holdings with no usable estimate", () => {
    const items = getActionItems(
      input({
        forecastHoldings: [
          forecast({ assetId: "nodate", nextExDateEstimate: null, nextAmountKrw: 30_000 }),
          forecast({ assetId: "noamount", nextExDateEstimate: "2026-05-22", nextAmountKrw: null }),
        ],
      })
    );
    expect(items).toEqual([]);
  });
});

describe("getActionItems — ordering", () => {
  it("sorts by severity first", () => {
    const items = getActionItems(
      input({
        scopedAssets: [krStock("s", 10_000_000, "SELF")],
        allAssets: [krStock("s", 10_000_000, "SELF")],
        dividends: [dividend(25_000_000, "SELF")],
        forecastHoldings: [
          forecast({ assetId: "a", nextExDateEstimate: "2026-05-22", nextAmountKrw: 1 }),
        ],
        targetAllocation: target({ STOCK_KR: 20, STOCK_FOREIGN: 20, BOND: 20, CASH: 20, PENSION: 20 }),
      })
    );
    expect(items[0].severity).toBe("URGENT");
    expect(items[0].category).toBe("TAX");
    expect(items[items.length - 1].severity).toBe("INFO");
  });

  it("puts a deadline-bound item ahead of an equally-severe drift item", () => {
    const items = getActionItems(
      input({
        scopedAssets: [krStock("s", 10_000_000, "SELF")],
        allAssets: [krStock("s", 10_000_000, "SELF")],
        // 18,000,000 is close to — but under — the threshold: ATTENTION, same
        // severity as the drift items this skew produces.
        dividends: [dividend(18_000_000, "SELF")],
        targetAllocation: target({ STOCK_KR: 20, STOCK_FOREIGN: 20, BOND: 20, CASH: 20, PENSION: 20 }),
      })
    );
    const attention = items.filter((i) => i.severity === "ATTENTION");
    expect(attention.length).toBeGreaterThan(1);
    expect(attention[0].category).toBe("TAX");
  });

  it("has nothing to say about an empty, on-target portfolio", () => {
    expect(getActionItems(input())).toEqual([]);
  });
});
