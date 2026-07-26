import { StockAsset } from "@/lib/models/asset";
import { ClosePoint } from "@/lib/models/stock-history";

const TRADING_DAYS = 252;

export type HistoryMap = Record<string, ClosePoint[]>;

function tickerKey(asset: StockAsset): string | null {
  const t = asset.ticker?.trim();
  return t ? t.toUpperCase() : null;
}

function dailyReturns(closes: number[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    if (closes[i - 1] > 0) out.push(closes[i] / closes[i - 1] - 1);
  }
  return out;
}

function stdev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function maxDrawdown(closes: number[]): number {
  let peak = closes[0] ?? 0;
  let mdd = 0;
  for (const c of closes) {
    if (c > peak) peak = c;
    if (peak > 0) mdd = Math.min(mdd, c / peak - 1);
  }
  return mdd * 100; // negative percent
}

export interface RiskRow {
  asset: StockAsset;
  /** Annualized volatility, percent. */
  volatility: number;
  /** Trailing ~1y price return, percent. */
  return1y: number;
  /** Max drawdown over the window, percent (<= 0). */
  maxDrawdown: number;
  /** 52-week range position (0 = low, 100 = high). */
  position: number;
  /** Number of usable price points. */
  points: number;
}

/** Per-stock risk metrics from price history (only stocks with data). */
export function getRiskRows(stocks: StockAsset[], history: HistoryMap): RiskRow[] {
  return stocks
    .map((asset): RiskRow | null => {
      const key = tickerKey(asset);
      const series = key ? history[key] : undefined;
      if (!series || series.length < 3) return null;
      const closes = series.map((p) => p.close);
      const returns = dailyReturns(closes);
      const low = Math.min(...closes);
      const high = Math.max(...closes);
      const current = closes[closes.length - 1];
      const first = closes[0];
      return {
        asset,
        volatility: stdev(returns) * Math.sqrt(TRADING_DAYS) * 100,
        return1y: first > 0 ? (current / first - 1) * 100 : 0,
        maxDrawdown: maxDrawdown(closes),
        position: high === low ? 100 : ((current - low) / (high - low)) * 100,
        points: closes.length,
      };
    })
    .filter((r): r is RiskRow => r !== null)
    .sort((a, b) => b.volatility - a.volatility);
}

function pearson(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n < 2) return 0;
  const ax = a.slice(0, n);
  const bx = b.slice(0, n);
  const ma = ax.reduce((s, v) => s + v, 0) / n;
  const mb = bx.reduce((s, v) => s + v, 0) / n;
  let cov = 0;
  let va = 0;
  let vb = 0;
  for (let i = 0; i < n; i++) {
    const da = ax[i] - ma;
    const db = bx[i] - mb;
    cov += da * db;
    va += da * da;
    vb += db * db;
  }
  const denom = Math.sqrt(va * vb);
  return denom === 0 ? 0 : cov / denom;
}

export interface CorrelationMatrix {
  assets: StockAsset[];
  /** matrix[i][j] = Pearson correlation of daily returns. */
  matrix: number[][];
  /** Overlapping trading days used. */
  days: number;
}

/**
 * Return-correlation matrix across the holdings with price history, aligned
 * on the dates common to all of them. Null when fewer than 2 qualify or the
 * overlap is too short to be meaningful.
 */
export function getCorrelationMatrix(
  stocks: StockAsset[],
  history: HistoryMap
): CorrelationMatrix | null {
  // Dedupe by ticker (two lots of the same ticker are one series).
  const seen = new Set<string>();
  const assets: StockAsset[] = [];
  for (const s of stocks) {
    const key = tickerKey(s);
    if (!key || !history[key] || seen.has(key)) continue;
    seen.add(key);
    assets.push(s);
  }
  if (assets.length < 2) return null;

  const dateMaps = assets.map((a) => {
    const map = new Map<string, number>();
    for (const p of history[tickerKey(a)!]) map.set(p.date, p.close);
    return map;
  });

  // Dates present in every series.
  const commonDates = [...dateMaps[0].keys()]
    .filter((d) => dateMaps.every((m) => m.has(d)))
    .sort();
  if (commonDates.length < 5) return null;

  const returnsPerAsset = dateMaps.map((m) =>
    dailyReturns(commonDates.map((d) => m.get(d)!))
  );

  const matrix = assets.map((_, i) =>
    assets.map((__, j) => (i === j ? 1 : pearson(returnsPerAsset[i], returnsPerAsset[j])))
  );

  return { assets, matrix, days: commonDates.length - 1 };
}
