import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_RETIREMENT_INPUTS,
  getRetirementInputs,
  isRetirementConfigured,
  normalizeRetirementByScope,
  normalizeRetirementInputs,
  withRetirementInputs,
} from "./retirement";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-06-15T00:00:00.000Z"));
});
afterEach(() => {
  vi.useRealTimers();
});

describe("normalizeRetirementInputs", () => {
  it("returns the defaults for anything that isn't an object", () => {
    for (const value of [undefined, null, 7, "x"]) {
      expect(normalizeRetirementInputs(value)).toEqual(DEFAULT_RETIREMENT_INPUTS);
    }
  });

  it("rejects an implausible birth year as unset", () => {
    expect(normalizeRetirementInputs({ birthYear: 1850 }).birthYear).toBe(0);
    expect(normalizeRetirementInputs({ birthYear: 2100 }).birthYear).toBe(0);
    expect(normalizeRetirementInputs({ birthYear: 1980 }).birthYear).toBe(1980);
  });

  it("clamps ages and rates into sane ranges", () => {
    const r = normalizeRetirementInputs({
      retirementAge: 200,
      expectedReturnPct: 999,
      inflationPct: -5,
    });
    expect(r.retirementAge).toBe(90);
    expect(r.expectedReturnPct).toBe(30);
    expect(r.inflationPct).toBe(0);
  });

  it("keeps life expectancy above the retirement age", () => {
    const r = normalizeRetirementInputs({ retirementAge: 70, lifeExpectancy: 60 });
    expect(r.lifeExpectancy).toBeGreaterThan(r.retirementAge);
  });

  it("floors money fields at zero", () => {
    const r = normalizeRetirementInputs({
      monthlyExpenseKrw: -100,
      monthlySavingKrw: "abc",
      otherMonthlyIncomeKrw: 500_000,
    });
    expect(r.monthlyExpenseKrw).toBe(0);
    expect(r.monthlySavingKrw).toBe(0);
    expect(r.otherMonthlyIncomeKrw).toBe(500_000);
  });

  it("defaults the saving mode to auto-detect", () => {
    expect(normalizeRetirementInputs({}).useDetectedSaving).toBe(true);
    expect(normalizeRetirementInputs({ useDetectedSaving: false }).useDetectedSaving).toBe(false);
  });
});

describe("normalizeRetirementByScope", () => {
  it("keeps only known owner-filter scopes", () => {
    const result = normalizeRetirementByScope({
      SELF: { birthYear: 1980 },
      NOBODY: { birthYear: 1990 },
      ALL: { birthYear: 1975 },
    });
    expect(Object.keys(result).sort()).toEqual(["ALL", "SELF"]);
    expect(result.SELF?.birthYear).toBe(1980);
  });

  it("returns an empty map for junk", () => {
    expect(normalizeRetirementByScope(undefined)).toEqual({});
    expect(normalizeRetirementByScope(42)).toEqual({});
  });
});

describe("isRetirementConfigured", () => {
  it("needs both a birth year and a monthly expense", () => {
    expect(isRetirementConfigured(DEFAULT_RETIREMENT_INPUTS)).toBe(false);
    expect(
      isRetirementConfigured({ ...DEFAULT_RETIREMENT_INPUTS, birthYear: 1980 })
    ).toBe(false);
    expect(
      isRetirementConfigured({
        ...DEFAULT_RETIREMENT_INPUTS,
        birthYear: 1980,
        monthlyExpenseKrw: 2_000_000,
      })
    ).toBe(true);
  });
});

describe("getRetirementInputs / withRetirementInputs", () => {
  it("falls back to the defaults for an unset scope", () => {
    expect(getRetirementInputs(undefined, "SELF")).toEqual(DEFAULT_RETIREMENT_INPUTS);
    expect(getRetirementInputs({}, "ALL")).toEqual(DEFAULT_RETIREMENT_INPUTS);
  });

  it("patches one scope without touching the others", () => {
    const before = withRetirementInputs({}, "SELF", { birthYear: 1980 });
    const after = withRetirementInputs(before, "SPOUSE", { birthYear: 1985 });
    expect(after.SELF?.birthYear).toBe(1980);
    expect(after.SPOUSE?.birthYear).toBe(1985);
    // The original is untouched — callers rely on this for React state.
    expect(before.SPOUSE).toBeUndefined();
  });

  it("merges into whatever the scope already had", () => {
    let map = withRetirementInputs({}, "SELF", { birthYear: 1980 });
    map = withRetirementInputs(map, "SELF", { monthlyExpenseKrw: 3_000_000 });
    expect(map.SELF).toMatchObject({ birthYear: 1980, monthlyExpenseKrw: 3_000_000 });
  });
});
