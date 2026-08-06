import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_RETIREMENT_INPUTS, RetirementInputs } from "@/lib/models/retirement";
import { detectSavingsPace, projectRetirement } from "./retirement-service";

/**
 * The projection depends on "this year", so the clock is pinned. Most cases
 * pick expectedReturn == inflation, which makes the **real** return exactly 0
 * — every figure then reduces to clean arithmetic that can be checked by hand.
 */
const NOW = new Date("2026-06-15T00:00:00.000Z");

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});
afterEach(() => {
  vi.useRealTimers();
});

/** Age 50 today, retire at 60, plan to 90 — with a 0% real return. */
function inputs(over: Partial<RetirementInputs> = {}): RetirementInputs {
  return {
    ...DEFAULT_RETIREMENT_INPUTS,
    birthYear: 2026 - 50,
    retirementAge: 60,
    lifeExpectancy: 90,
    monthlyExpenseKrw: 2_000_000,
    otherMonthlyIncomeKrw: 0,
    expectedReturnPct: 2.5,
    inflationPct: 2.5, // real return = 0
    ...over,
  };
}

describe("projectRetirement — the frame", () => {
  it("derives age and horizons from the birth year", () => {
    const p = projectRetirement(inputs(), 0, 1_000_000);
    expect(p.currentAge).toBe(50);
    expect(p.yearsToRetirement).toBe(10);
    expect(p.yearsInRetirement).toBe(30);
    expect(p.netMonthlyWithdrawalKrw).toBe(2_000_000);
  });

  it("subtracts other retirement income from the withdrawal", () => {
    const p = projectRetirement(inputs({ otherMonthlyIncomeKrw: 1_500_000 }), 0, 0);
    expect(p.netMonthlyWithdrawalKrw).toBe(500_000);
  });

  it("retires now for someone already past their target age", () => {
    const p = projectRetirement(inputs({ birthYear: 2026 - 65 }), 100_000_000, 1_000_000);
    expect(p.currentAge).toBe(65);
    expect(p.yearsToRetirement).toBe(0);
    // No accumulation left — retirement assets are just what's there today.
    expect(p.base.retirementAssetsRealKrw).toBe(100_000_000);
  });
});

describe("projectRetirement — with a 0% real return (hand-checked)", () => {
  // current 0, save 1,000,000/mo for 120 months → 120,000,000 real.
  // need 2,000,000/mo for 360 months → 720,000,000 real.
  const p = () => projectRetirement(inputs(), 0, 1_000_000);

  it("accumulates savings with no growth as a plain sum", () => {
    expect(p().base.retirementAssetsRealKrw).toBeCloseTo(120_000_000, 2);
  });

  it("needs the full undiscounted cost of the retirement years", () => {
    expect(p().neededRealKrw).toBeCloseTo(720_000_000, 2);
  });

  it("reports the shortfall and achievement ratio", () => {
    expect(p().surplusRealKrw).toBeCloseTo(-600_000_000, 2);
    expect(p().achievementRatio).toBeCloseTo(120 / 720, 5);
  });

  it("finds the age the money runs out", () => {
    // 120,000,000 ÷ 2,000,000 = 60 months = 5 years → age 65.
    expect(p().depletionAge).toBeCloseTo(65, 5);
  });

  it("prescribes each lever so it exactly closes the gap", () => {
    const rx = p().prescription;
    expect(rx.onTrack).toBe(false);
    // Save 5,000,000 more: (1,000,000 + 5,000,000) × 120 = 720,000,000.
    expect(rx.extraMonthlySavingKrw).toBeCloseTo(5_000_000, 2);
    // Retire later: 1,000,000·(120+12d) ≥ 2,000,000·(360−12d) → d = 17.
    expect(rx.delayYears).toBe(17);
    // Spend less: 120,000,000 ÷ 360 = 333,333 sustainable → cut 1,666,667.
    expect(rx.reduceMonthlyExpenseKrw).toBeCloseTo(1_666_666.67, 1);
  });
});

describe("projectRetirement — funded plans", () => {
  it("is on track with a surplus and no prescriptions", () => {
    const p = projectRetirement(inputs(), 1_000_000_000, 0);
    expect(p.surplusRealKrw).toBeCloseTo(280_000_000, 2); // 1,000M − 720M
    expect(p.prescription).toMatchObject({
      onTrack: true,
      extraMonthlySavingKrw: 0,
      delayYears: 0,
      reduceMonthlyExpenseKrw: 0,
    });
    // Lasts past the plan (age 90), depleting only much later.
    expect(p.depletionAge).toBeGreaterThan(90);
  });

  it("never depletes when other income covers the whole expense", () => {
    const p = projectRetirement(inputs({ otherMonthlyIncomeKrw: 2_000_000 }), 50_000_000, 0);
    expect(p.netMonthlyWithdrawalKrw).toBe(0);
    expect(p.neededRealKrw).toBe(0);
    expect(p.achievementRatio).toBe(Infinity);
    expect(p.depletionAge).toBeNull();
    expect(p.prescription.onTrack).toBe(true);
  });
});

describe("projectRetirement — real vs nominal", () => {
  it("keeps the real figure below the nominal one under inflation", () => {
    // 5% nominal, 2.5% inflation → positive real return, plus inflation gross-up.
    const p = projectRetirement(inputs({ expectedReturnPct: 5, inflationPct: 2.5 }), 100_000_000, 500_000);
    expect(p.base.retirementAssetsNominalKrw).toBeGreaterThan(p.base.retirementAssetsRealKrw);
    // 10 years of 2.5% inflation ≈ ×1.28.
    expect(p.base.retirementAssetsNominalKrw / p.base.retirementAssetsRealKrw).toBeCloseTo(
      Math.pow(1.025, 10),
      4
    );
  });

  it("orders the scenarios conservative < base < optimistic", () => {
    const p = projectRetirement(inputs({ expectedReturnPct: 5 }), 100_000_000, 500_000);
    const [c, b, o] = p.scenarios.map((s) => s.retirementAssetsRealKrw);
    expect(c).toBeLessThan(b);
    expect(b).toBeLessThan(o);
    expect(p.scenarios.map((s) => s.nominalReturnPct)).toEqual([3, 5, 7]);
  });
});

describe("projectRetirement — the band series", () => {
  it("has one point per year through retirement, aged and dated", () => {
    const p = projectRetirement(inputs(), 100_000_000, 1_000_000);
    expect(p.bandSeries).toHaveLength(11); // ages 50…60
    expect(p.bandSeries[0]).toMatchObject({ year: 2026, age: 50 });
    expect(p.bandSeries[10]).toMatchObject({ year: 2036, age: 60 });
  });

  it("starts at today's assets and rises with saving", () => {
    const p = projectRetirement(inputs(), 100_000_000, 1_000_000);
    expect(p.bandSeries[0].baseKrw).toBeCloseTo(100_000_000, 2);
    expect(p.bandSeries[10].baseKrw).toBeGreaterThan(p.bandSeries[0].baseKrw);
    // Optimistic stays at or above base at the end.
    expect(p.bandSeries[10].optimisticKrw).toBeGreaterThanOrEqual(p.bandSeries[10].baseKrw);
  });
});

describe("detectSavingsPace", () => {
  function series(...principals: number[]) {
    // One reading per month starting 2026-01.
    return principals.map((totalPrincipal, i) => ({
      date: `2026-${String(i + 1).padStart(2, "0")}-15`,
      totalPrincipal,
    }));
  }

  it("returns null without at least two months", () => {
    expect(detectSavingsPace([])).toBeNull();
    expect(detectSavingsPace(series(1_000_000))).toBeNull();
  });

  it("takes the median of month-over-month principal changes", () => {
    // Deltas: +1,000,000 each month.
    const pace = detectSavingsPace(series(0, 1_000_000, 2_000_000, 3_000_000));
    expect(pace?.monthlyMedianKrw).toBe(1_000_000);
    expect(pace?.samples).toBe(3);
    expect(pace?.noisy).toBe(false);
  });

  it("uses the last reading of each month", () => {
    const pace = detectSavingsPace([
      { date: "2026-01-05", totalPrincipal: 0 },
      { date: "2026-01-28", totalPrincipal: 500_000 },
      { date: "2026-02-15", totalPrincipal: 1_500_000 },
    ]);
    // Jan ends at 500,000; Feb at 1,500,000 → one delta of 1,000,000.
    expect(pace?.monthlyMedianKrw).toBe(1_000_000);
    expect(pace?.samples).toBe(1);
  });

  it("resists a one-off jump by using the median, and flags the lumpiness", () => {
    // Steady 500,000 except one 20,000,000 spike (a late-entered asset).
    const pace = detectSavingsPace(
      series(0, 500_000, 1_000_000, 21_000_000, 21_500_000, 22_000_000)
    );
    expect(pace?.monthlyMedianKrw).toBe(500_000); // not dragged up by the spike
    expect(pace?.noisy).toBe(true);
  });

  it("only counts the most recent months", () => {
    const many = series(...Array.from({ length: 20 }, (_, i) => i * 1_000_000));
    const pace = detectSavingsPace(many, 6);
    expect(pace?.samples).toBe(6);
  });
});
