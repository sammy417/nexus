import { describe, expect, it } from "vitest";
import { Asset, StockAsset } from "@/lib/models/asset";
import { UNCLASSIFIED_SECTOR } from "@/lib/models/stock-sector";
import {
  getConcentration,
  getContributions,
  getCurrencyAllocation,
  getRegionAllocation,
  getSectorAllocation,
  getStockHoldings,
  getStockSummary,
} from "./stock-analysis-service";

const USD_KRW = 1000;

/** Builds a stock whose valuation is exactly `valuation` KRW at qty 1. */
function stock(over: Partial<StockAsset> & { name: string }): StockAsset {
  return {
    id: over.name,
    type: "STOCK",
    market: "KOSPI",
    quantity: 1,
    avgPrice: 0,
    currentPrice: 0,
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
    ...over,
  };
}

describe("getStockHoldings", () => {
  const assets: Asset[] = [
    stock({ name: "작은주식", currentPrice: 1_000_000 }),
    stock({ name: "큰주식", currentPrice: 3_000_000 }),
    {
      id: "cash",
      type: "CASH",
      name: "예금",
      balance: 9_000_000,
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    },
  ];

  it("ignores everything that isn't a stock", () => {
    expect(getStockHoldings(assets, USD_KRW).map((h) => h.asset.name)).toEqual([
      "큰주식",
      "작은주식",
    ]);
  });

  it("weights each holding against the stock total, not the whole portfolio", () => {
    const holdings = getStockHoldings(assets, USD_KRW);
    // Cash is excluded from the denominator: 3M/4M, not 3M/13M.
    expect(holdings[0].weight).toBeCloseTo(75, 6);
    expect(holdings.reduce((sum, h) => sum + h.weight, 0)).toBeCloseTo(100, 6);
  });

  it("derives the region from the market, not the currency alone", () => {
    const holdings = getStockHoldings(
      [
        stock({ name: "삼성전자", market: "KOSPI", currentPrice: 1 }),
        stock({ name: "엔비디아", market: "NASDAQ", currency: "USD", currentPrice: 1 }),
      ],
      USD_KRW
    );
    const byName = Object.fromEntries(holdings.map((h) => [h.asset.name, h.region]));
    expect(byName["삼성전자"]).toBe("KR");
    expect(byName["엔비디아"]).toBe("FOREIGN");
  });

  it("labels a stock with no sector as 미분류", () => {
    const [holding] = getStockHoldings([stock({ name: "무섹터", currentPrice: 1 })], USD_KRW);
    expect(holding.sector).toBe(UNCLASSIFIED_SECTOR);
  });
});

describe("getStockSummary", () => {
  it("counts gainers and losers, leaving break-even holdings out of both", () => {
    const holdings = getStockHoldings(
      [
        stock({ name: "오름", avgPrice: 100, currentPrice: 150 }),
        stock({ name: "내림", avgPrice: 100, currentPrice: 50 }),
        stock({ name: "제자리", avgPrice: 100, currentPrice: 100 }),
      ],
      USD_KRW
    );
    const s = getStockSummary(holdings);
    expect(s.count).toBe(3);
    expect(s.gainers).toBe(1);
    expect(s.losers).toBe(1);
    expect(s.totalPrincipal).toBe(300);
    expect(s.totalProfit).toBe(0);
    expect(s.totalProfitRate).toBe(0);
  });

  it("returns zeros for no holdings instead of NaN", () => {
    const s = getStockSummary([]);
    expect(s.count).toBe(0);
    expect(s.totalProfitRate).toBe(0);
  });
});

describe("getSectorAllocation", () => {
  it("splits a dominant sector by its free-text sub-sectors", () => {
    const holdings = getStockHoldings(
      [
        stock({ name: "A", sector: "기술", subSector: "반도체", currentPrice: 4_000_000 }),
        stock({ name: "B", sector: "기술", subSector: "반도체", currentPrice: 2_000_000 }),
        stock({ name: "C", sector: "기술", subSector: "AI SW", currentPrice: 3_000_000 }),
        stock({ name: "D", sector: "금융", currentPrice: 1_000_000 }),
      ],
      USD_KRW
    );
    const allocation = getSectorAllocation(holdings);
    expect(allocation.map((e) => e.key)).toEqual(["기술 (반도체)", "기술 (AI SW)", "금융"]);
    expect(allocation[0].valuation).toBe(6_000_000);
    expect(allocation[0].ratio).toBeCloseTo(60, 6);
    // The base sector rides along on every slice so the shades stay in family.
    expect(allocation.slice(0, 2).map((e) => e.baseSector)).toEqual(["기술", "기술"]);
    expect(allocation[0].subSector).toBe("반도체");
    expect(allocation[2].subSector).toBeUndefined();
  });

  it("keeps a sector whole when no holding carries a sub-sector", () => {
    const holdings = getStockHoldings(
      [
        stock({ name: "A", sector: "기술", currentPrice: 1_000_000 }),
        stock({ name: "B", sector: "기술", currentPrice: 1_000_000 }),
      ],
      USD_KRW
    );
    expect(getSectorAllocation(holdings)).toEqual([
      { key: "기술", valuation: 2_000_000, ratio: 100, baseSector: "기술", subSector: undefined },
    ]);
  });

  it("treats a blank sub-sector as no sub-sector", () => {
    const holdings = getStockHoldings(
      [
        stock({ name: "A", sector: "기술", currentPrice: 1_000_000 }),
        stock({ name: "B", sector: "기술", subSector: "   ", currentPrice: 1_000_000 }),
      ],
      USD_KRW
    );
    expect(getSectorAllocation(holdings)).toHaveLength(1);
  });
});

describe("region and currency allocation", () => {
  const holdings = getStockHoldings(
    [
      stock({ name: "삼성전자", market: "KOSPI", currentPrice: 4_000_000 }),
      stock({ name: "엔비디아", market: "NASDAQ", currency: "USD", currentPrice: 5_000 }),
      // Foreign-listed but priced in KRW — region and currency disagree here.
      stock({ name: "도쿄상장", market: "TSE", currentPrice: 1_000_000 }),
    ],
    USD_KRW
  );

  it("groups by listing region", () => {
    expect(getRegionAllocation(holdings)).toEqual([
      { key: "FOREIGN", valuation: 6_000_000, ratio: 60 },
      { key: "KR", valuation: 4_000_000, ratio: 40 },
    ]);
  });

  it("groups by trading currency, defaulting to KRW", () => {
    const byCurrency = Object.fromEntries(
      getCurrencyAllocation(holdings).map((e) => [e.key, e.valuation])
    );
    expect(byCurrency.KRW).toBe(5_000_000);
    expect(byCurrency.USD).toBe(5_000_000);
  });
});

describe("getConcentration", () => {
  function equalWeighted(n: number) {
    return getStockHoldings(
      Array.from({ length: n }, (_, i) => stock({ name: `S${i}`, currentPrice: 1_000_000 })),
      USD_KRW
    );
  }

  it("scores a perfectly equal-weighted portfolio as fully diversified", () => {
    const c = getConcentration(equalWeighted(4));
    expect(c.hhi).toBeCloseTo(2500, 6); // 4 × 0.25²  × 10000
    expect(c.effectiveN).toBeCloseTo(4, 6);
    expect(c.diversificationScore).toBe(100);
  });

  it("counts only the five largest holdings in top5Weight", () => {
    const c = getConcentration(equalWeighted(10));
    expect(c.top5Weight).toBeCloseTo(50, 6);
    expect(c.count).toBe(10);
  });

  it("scores a single holding as maximally concentrated", () => {
    const c = getConcentration(equalWeighted(1));
    expect(c.hhi).toBeCloseTo(10000, 6);
    expect(c.effectiveN).toBeCloseTo(1, 6);
    // One holding can't be diversified at all, regardless of effective N.
    expect(c.diversificationScore).toBe(0);
  });

  it("penalizes a lopsided portfolio against an equal-weighted one of the same size", () => {
    const lopsided = getStockHoldings(
      [
        stock({ name: "거대", currentPrice: 9_000_000 }),
        stock({ name: "소형1", currentPrice: 500_000 }),
        stock({ name: "소형2", currentPrice: 500_000 }),
      ],
      USD_KRW
    );
    const c = getConcentration(lopsided);
    expect(c.effectiveN).toBeLessThan(3);
    expect(c.diversificationScore).toBeLessThan(getConcentration(equalWeighted(3)).diversificationScore);
  });

  it("returns zeros for no holdings", () => {
    expect(getConcentration([])).toEqual({
      count: 0,
      top5Weight: 0,
      hhi: 0,
      effectiveN: 0,
      diversificationScore: 0,
    });
  });
});

describe("getContributions", () => {
  const holdings = getStockHoldings(
    [
      stock({ name: "이익", avgPrice: 1_000_000, currentPrice: 4_000_000 }),
      stock({ name: "손실", avgPrice: 1_000_000, currentPrice: 0 }),
    ],
    USD_KRW
  );

  it("scales each share against the sum of absolute P&L so losses stay comparable", () => {
    const contributions = getContributions(holdings);
    // |+3,000,000| + |−1,000,000| = 4,000,000.
    expect(contributions[0].share).toBeCloseTo(75, 6);
    expect(contributions[1].share).toBeCloseTo(-25, 6);
  });

  it("orders from the biggest gainer to the biggest loser", () => {
    expect(getContributions(holdings).map((c) => c.holding.asset.name)).toEqual(["이익", "손실"]);
  });

  it("reports a zero share when nothing has moved", () => {
    const flat = getStockHoldings(
      [stock({ name: "제자리", avgPrice: 1_000, currentPrice: 1_000 })],
      USD_KRW
    );
    expect(getContributions(flat)[0].share).toBe(0);
  });
});
