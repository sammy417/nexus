import { Asset } from "@/lib/models/asset";
import { PortfolioSnapshot } from "@/lib/models/snapshot";
import { getAllocationByType, getPortfolioSummary } from "./portfolio-service";

export function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Compute today's (or any date's) snapshot from the current asset list. */
export function buildSnapshot(assets: Asset[], date: string): PortfolioSnapshot {
  const summary = getPortfolioSummary(assets);
  const byType: PortfolioSnapshot["byType"] = {};
  for (const entry of getAllocationByType(assets)) {
    byType[entry.type] = entry.valuation;
  }
  return {
    date,
    totalPrincipal: summary.totalPrincipal,
    totalValuation: summary.totalValuation,
    byType,
  };
}

/** Deterministic PRNG so the generated demo history is stable across reseeds. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Demo-only: fabricate a plausible daily history ending at the current
 * portfolio state, by random-walking the valuation backwards from today.
 * Used to seed a fresh database so the trend chart has something to show;
 * real snapshots overwrite/append from then on.
 */
export function generateSeedHistory(assets: Asset[], days: number): PortfolioSnapshot[] {
  const today = buildSnapshot(assets, toDateKey(new Date()));
  const rand = mulberry32(20260718);

  const snapshots: PortfolioSnapshot[] = [today];
  let valuation = today.totalValuation;

  for (let i = 1; i < days; i++) {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - i);
    // Daily move in ±0.9%, slightly biased so history trends below today.
    const dailyReturn = (rand() - 0.52) * 0.018;
    valuation = valuation / (1 + dailyReturn);

    const scale = today.totalValuation === 0 ? 0 : valuation / today.totalValuation;
    const byType: PortfolioSnapshot["byType"] = {};
    for (const [type, value] of Object.entries(today.byType)) {
      byType[type as keyof PortfolioSnapshot["byType"]] = Math.round(value * scale);
    }

    snapshots.push({
      date: toDateKey(date),
      totalPrincipal: today.totalPrincipal,
      totalValuation: Math.round(valuation),
      byType,
    });
  }

  return snapshots.reverse();
}
