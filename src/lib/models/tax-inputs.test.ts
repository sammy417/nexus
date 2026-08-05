import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  currentTaxYear,
  DEFAULT_TAX_YEAR_INPUTS,
  getTaxInputs,
  normalizeTaxInputsByYear,
  realizedGainsKrw,
  TaxInputsByYear,
  withTaxInputs,
} from "./tax-inputs";

describe("currentTaxYear", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("follows the calendar year", () => {
    vi.setSystemTime(new Date("2026-12-31T23:00:00.000Z"));
    expect(currentTaxYear()).toBe("2026");
    vi.setSystemTime(new Date("2027-01-01T01:00:00.000Z"));
    expect(currentTaxYear()).toBe("2027");
  });
});

describe("realizedGainsKrw", () => {
  it("signs the magnitude by the stored toggle", () => {
    expect(realizedGainsKrw({ ...DEFAULT_TAX_YEAR_INPUTS, realizedMagnitudeKrw: 3_000_000 })).toBe(
      3_000_000
    );
    expect(
      realizedGainsKrw({
        ...DEFAULT_TAX_YEAR_INPUTS,
        realizedSign: "LOSS",
        realizedMagnitudeKrw: 3_000_000,
      })
    ).toBe(-3_000_000);
  });

  it("treats a negative magnitude as zero rather than flipping the sign twice", () => {
    expect(
      realizedGainsKrw({
        ...DEFAULT_TAX_YEAR_INPUTS,
        realizedSign: "LOSS",
        realizedMagnitudeKrw: -5,
      })
    ).toBe(0);
  });
});

describe("normalizeTaxInputsByYear", () => {
  it("returns an empty map for anything that isn't an object", () => {
    for (const value of [undefined, null, 42, "x", []]) {
      expect(normalizeTaxInputsByYear(value)).toEqual({});
    }
  });

  it("fills missing fields with the defaults", () => {
    const result = normalizeTaxInputsByYear({ "2026": { SELF: { irpKrw: 3_000_000 } } });
    expect(result["2026"].SELF).toEqual({ ...DEFAULT_TAX_YEAR_INPUTS, irpKrw: 3_000_000 });
  });

  it("rejects negative and non-numeric amounts", () => {
    const result = normalizeTaxInputsByYear({
      "2026": {
        SELF: {
          realizedMagnitudeKrw: -1_000,
          unrecordedDividendKrw: "abc",
          pensionSavingsKrw: Number.NaN,
          irpKrw: Number.POSITIVE_INFINITY,
        },
      },
    });
    expect(result["2026"].SELF).toMatchObject({
      realizedMagnitudeKrw: 0,
      unrecordedDividendKrw: 0,
      pensionSavingsKrw: 0,
      irpKrw: 0,
    });
  });

  it("keeps only string ids in the excluded list", () => {
    const result = normalizeTaxInputsByYear({
      "2026": { SELF: { excludedLotIds: ["a", 3, null, "b"] } },
    });
    expect(result["2026"].SELF?.excludedLotIds).toEqual(["a", "b"]);
  });

  it("drops keys that aren't four-digit years and owners that aren't real", () => {
    const result = normalizeTaxInputsByYear({
      "2026": { SELF: {}, NOBODY: {} },
      notAYear: { SELF: {} },
      "26": { SELF: {} },
    });
    expect(Object.keys(result)).toEqual(["2026"]);
    expect(Object.keys(result["2026"])).toEqual(["SELF"]);
  });

  it("retains only the five most recent years", () => {
    const stored: Record<string, unknown> = {};
    for (const year of ["2019", "2020", "2021", "2022", "2023", "2024", "2025", "2026"]) {
      stored[year] = { SELF: { irpKrw: 1 } };
    }
    expect(Object.keys(normalizeTaxInputsByYear(stored))).toEqual([
      "2022",
      "2023",
      "2024",
      "2025",
      "2026",
    ]);
  });

  it("omits a year whose owners all failed to parse", () => {
    expect(normalizeTaxInputsByYear({ "2026": { NOBODY: {} } })).toEqual({});
  });

  it("preserves a stored LOSS sign", () => {
    const result = normalizeTaxInputsByYear({ "2026": { SELF: { realizedSign: "LOSS" } } });
    expect(result["2026"].SELF?.realizedSign).toBe("LOSS");
    // Anything unrecognized falls back to GAIN rather than silently negating.
    expect(
      normalizeTaxInputsByYear({ "2026": { SELF: { realizedSign: "???" } } })["2026"].SELF
        ?.realizedSign
    ).toBe("GAIN");
  });
});

describe("getTaxInputs / withTaxInputs", () => {
  it("falls back to the defaults for a year or owner with nothing stored", () => {
    expect(getTaxInputs(undefined, "2026", "SELF")).toEqual(DEFAULT_TAX_YEAR_INPUTS);
    expect(getTaxInputs({}, "2026", "SELF")).toEqual(DEFAULT_TAX_YEAR_INPUTS);
    expect(getTaxInputs({ "2026": {} }, "2026", "SPOUSE")).toEqual(DEFAULT_TAX_YEAR_INPUTS);
  });

  it("patches one owner-year without touching the rest", () => {
    const before: TaxInputsByYear = {
      "2025": { SELF: { ...DEFAULT_TAX_YEAR_INPUTS, irpKrw: 111 } },
      "2026": { SPOUSE: { ...DEFAULT_TAX_YEAR_INPUTS, irpKrw: 222 } },
    };
    const after = withTaxInputs(before, "2026", "SELF", { irpKrw: 333 });

    expect(after["2026"].SELF?.irpKrw).toBe(333);
    expect(after["2026"].SPOUSE?.irpKrw).toBe(222);
    expect(after["2025"].SELF?.irpKrw).toBe(111);
    // The original is untouched — callers rely on this for React state.
    expect(before["2026"].SELF).toBeUndefined();
  });

  it("merges into whatever the owner already had", () => {
    const after = withTaxInputs({}, "2026", "SELF", { irpKrw: 100 });
    const merged = withTaxInputs(after, "2026", "SELF", { pensionSavingsKrw: 200 });
    expect(merged["2026"].SELF).toMatchObject({ irpKrw: 100, pensionSavingsKrw: 200 });
  });

  it("keeps each owner's figures separate — tax is per person", () => {
    let map = withTaxInputs({}, "2026", "SELF", { unrecordedDividendKrw: 5_000_000 });
    map = withTaxInputs(map, "2026", "SPOUSE", { unrecordedDividendKrw: 1_000_000 });
    expect(getTaxInputs(map, "2026", "SELF").unrecordedDividendKrw).toBe(5_000_000);
    expect(getTaxInputs(map, "2026", "SPOUSE").unrecordedDividendKrw).toBe(1_000_000);
  });

  it("starts a new tax year from the defaults rather than carrying last year's figures", () => {
    const map = withTaxInputs({}, "2026", "SELF", { realizedMagnitudeKrw: 9_000_000 });
    expect(getTaxInputs(map, "2027", "SELF")).toEqual(DEFAULT_TAX_YEAR_INPUTS);
  });
});
