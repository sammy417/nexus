import { describe, expect, it } from "vitest";
import { Asset } from "@/lib/models/asset";
import { Goal } from "@/lib/models/goal";
import { getAllGoalProgress, getGoalProgress, getUnassignedAssets } from "./goal-service";

const USD_KRW = 1000;
const NOW = new Date("2026-06-15T00:00:00.000Z");
const base = { name: "n", createdAt: "2026-01-01", updatedAt: "2026-01-01" };

function cash(id: string, balance: number): Asset {
  return { ...base, id, type: "CASH", balance };
}
function krStock(id: string, valuation: number): Asset {
  return { ...base, id, type: "STOCK", market: "KOSPI", quantity: 1, avgPrice: 0, currentPrice: valuation };
}
function goal(over: Partial<Goal> & { id: string; targetDate: string }): Goal {
  return { name: "목표", targetAmountKrw: 100_000_000, assetIds: [], ...over };
}

describe("getGoalProgress", () => {
  it("sums the earmarked assets and measures progress against the target", () => {
    const p = getGoalProgress(
      goal({ id: "g", targetDate: "2027-06-15", assetIds: ["c", "s"] }),
      [cash("c", 30_000_000), krStock("s", 10_000_000), cash("other", 999)],
      USD_KRW,
      NOW
    );
    expect(p.assignedKrw).toBe(40_000_000);
    expect(p.progressRatio).toBeCloseTo(0.4, 6);
    expect(p.remainingKrw).toBe(60_000_000);
    expect(p.complete).toBe(false);
  });

  it("spreads the shortfall over the months left", () => {
    // Exactly one year out → ~12 months.
    const p = getGoalProgress(
      goal({ id: "g", targetDate: "2027-06-15", assetIds: ["c"] }),
      [cash("c", 40_000_000)],
      USD_KRW,
      NOW
    );
    expect(p.requiredMonthlyKrw).toBeCloseTo(p.remainingKrw / p.monthsRemaining, 4);
    expect(p.requiredMonthlyKrw).toBeGreaterThan(4_800_000); // 60M / ~12
    expect(p.requiredMonthlyKrw).toBeLessThan(5_200_000);
  });

  it("marks a fully funded goal complete with nothing left to save", () => {
    const p = getGoalProgress(
      goal({ id: "g", targetDate: "2027-06-15", targetAmountKrw: 30_000_000, assetIds: ["c"] }),
      [cash("c", 40_000_000)],
      USD_KRW,
      NOW
    );
    expect(p.complete).toBe(true);
    expect(p.remainingKrw).toBe(0);
    expect(p.requiredMonthlyKrw).toBeNull();
    expect(p.nearTermEquityRisk).toBe(false);
  });

  it("flags a past-due, underfunded goal and stops prescribing a monthly amount", () => {
    const p = getGoalProgress(
      goal({ id: "g", targetDate: "2025-01-01", assetIds: ["c"] }),
      [cash("c", 40_000_000)],
      USD_KRW,
      NOW
    );
    expect(p.pastDue).toBe(true);
    expect(p.daysRemaining).toBeLessThan(0);
    expect(p.requiredMonthlyKrw).toBeNull();
  });

  it("treats a target within a month as a lump, not a monthly plan", () => {
    const p = getGoalProgress(
      goal({ id: "g", targetDate: "2026-07-01", assetIds: ["c"] }),
      [cash("c", 40_000_000)],
      USD_KRW,
      NOW
    );
    expect(p.monthsRemaining).toBeLessThan(1);
    expect(p.requiredMonthlyKrw).toBeNull();
  });

  describe("near-term equity risk", () => {
    const soon = "2027-06-15"; // ~12 months
    const far = "2032-06-15"; // ~6 years

    it("fires when a near-term goal holds too much equity", () => {
      const p = getGoalProgress(
        goal({ id: "g", targetDate: soon, assetIds: ["s", "c"] }),
        [krStock("s", 30_000_000), cash("c", 10_000_000)],
        USD_KRW,
        NOW
      );
      expect(p.stockRatio).toBeCloseTo(0.75, 6);
      expect(p.nearTermEquityRisk).toBe(true);
    });

    it("stays quiet when the same mix is far off", () => {
      const p = getGoalProgress(
        goal({ id: "g", targetDate: far, assetIds: ["s", "c"] }),
        [krStock("s", 30_000_000), cash("c", 10_000_000)],
        USD_KRW,
        NOW
      );
      expect(p.nearTermEquityRisk).toBe(false);
    });

    it("stays quiet when a near-term goal is mostly safe assets", () => {
      const p = getGoalProgress(
        goal({ id: "g", targetDate: soon, assetIds: ["s", "c"] }),
        [krStock("s", 10_000_000), cash("c", 90_000_000)],
        USD_KRW,
        NOW
      );
      expect(p.stockRatio).toBeCloseTo(0.1, 6);
      expect(p.nearTermEquityRisk).toBe(false);
    });
  });

  it("reports earmarked ids that no longer resolve to an asset", () => {
    const p = getGoalProgress(
      goal({ id: "g", targetDate: "2027-06-15", assetIds: ["c", "deleted"] }),
      [cash("c", 40_000_000)],
      USD_KRW,
      NOW
    );
    expect(p.assignedKrw).toBe(40_000_000);
    expect(p.missingAssetIds).toEqual(["deleted"]);
  });

  it("counts any assignment as complete when the target is zero", () => {
    const p = getGoalProgress(
      goal({ id: "g", targetDate: "2027-06-15", targetAmountKrw: 0, assetIds: ["c"] }),
      [cash("c", 1_000)],
      USD_KRW,
      NOW
    );
    expect(p.progressRatio).toBe(1);
  });
});

describe("getAllGoalProgress", () => {
  it("orders goals by the soonest deadline", () => {
    const goals = [
      goal({ id: "late", targetDate: "2030-01-01" }),
      goal({ id: "soon", targetDate: "2026-12-01" }),
      goal({ id: "mid", targetDate: "2028-01-01" }),
    ];
    expect(getAllGoalProgress(goals, [], USD_KRW, NOW).map((p) => p.goal.id)).toEqual([
      "soon",
      "mid",
      "late",
    ]);
  });
});

describe("getUnassignedAssets", () => {
  it("returns the assets no goal has claimed, with their total", () => {
    const assets = [cash("a", 1_000_000), cash("b", 2_000_000), krStock("c", 3_000_000)];
    const goals = [goal({ id: "g", targetDate: "2027-01-01", assetIds: ["b"] })];
    const result = getUnassignedAssets(assets, goals, USD_KRW);
    expect(result.assets.map((a) => a.id)).toEqual(["a", "c"]);
    expect(result.totalKrw).toBe(4_000_000);
  });

  it("returns everything when there are no goals", () => {
    const assets = [cash("a", 1_000_000)];
    expect(getUnassignedAssets(assets, [], USD_KRW).totalKrw).toBe(1_000_000);
  });
});
