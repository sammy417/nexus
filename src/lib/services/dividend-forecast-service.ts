import "server-only";
import { AssetOwner, StockAsset } from "@/lib/models/asset";
import { getAssetOwner } from "@/lib/models/asset-owner";
import { getAssetRepository } from "@/lib/repositories";
import { mapWithConcurrency } from "./concurrency";
import { DEFAULT_USD_KRW } from "./portfolio-service";
import { DividendEvent, fetchDividendHistory, fetchUsdKrwRate } from "./quote-service";

/**
 * Tickers fetched at once. Six keeps a large portfolio well under a second
 * of wall time while staying polite enough that the (key-less, unofficial)
 * upstream doesn't start refusing requests.
 */
const DIVIDEND_FETCH_CONCURRENCY = 6;

/**
 * Pre-tax dividend estimates derived from each stock holding's external
 * dividend history (no manual input). Everything here is an estimate:
 * amounts are gross per-share figures at the CURRENT quantity, and the
 * next date is projected from the past payment cadence, not from any
 * corporate announcement.
 */

export interface HoldingDividendForecast {
  assetId: string;
  name: string;
  ticker: string;
  owner: AssetOwner;
  quantity: number;
  /** Trading currency of the security (and of the per-share figures). */
  currency: string;
  /** Current market valuation of the position, in KRW. */
  valuationKrw: number;
  /** Sum of per-share dividends over the trailing 12 months. */
  perShareTrailing12m: number;
  /** Most recent per-share dividend. */
  perShareLast: number;
  /** Trailing dividends / current price, in percent. */
  yieldPct: number | null;
  /** Trailing per-share total × quantity, converted to KRW. */
  annualEstimateKrw: number;
  /** Payments observed in the trailing 12 months (0 = none). */
  frequencyPerYear: number;
  lastExDate: string | null;
  /** Last ex-date + average interval, rolled forward past today. */
  nextExDateEstimate: string | null;
  /** Last per-share amount × quantity, converted to KRW. */
  nextAmountKrw: number | null;
}

/** A past ex-dividend the user may not have recorded yet (one-click add). */
export interface DividendSuggestion {
  assetId: string;
  name: string;
  ticker: string;
  owner: AssetOwner;
  /** Ex-date, YYYY-MM-DD. */
  date: string;
  /** Amount in the security's currency (per-share × current quantity). */
  amount: number;
  currency: string;
  amountKrw: number;
}

export interface DividendForecast {
  holdings: HoldingDividendForecast[];
  totalAnnualKrw: number;
  /** Valuation (KRW) of the quoted holdings, for the portfolio yield. */
  quotedValuationKrw: number;
  portfolioYieldPct: number | null;
  usdKrw: number;
  /** Recent past ex-dividends across holdings (client filters already-recorded). */
  suggestions: DividendSuggestion[];
  /** Tickers whose external lookup failed (still shown to the user). */
  failedTickers: string[];
}

function trailingEvents(events: DividendEvent[], days: number): DividendEvent[] {
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - days);
  const cutoffKey = cutoff.toISOString().slice(0, 10);
  return events.filter((event) => event.date >= cutoffKey);
}

function estimateNextExDate(events: DividendEvent[]): string | null {
  if (events.length === 0) return null;
  const last = events[events.length - 1];
  const intervalDays =
    events.length >= 2
      ? Math.max(
          20,
          Math.round(
            (new Date(last.date).getTime() - new Date(events[0].date).getTime()) /
              86400000 /
              (events.length - 1)
          )
        )
      : 365;

  const next = new Date(last.date);
  for (let i = 0; i < 24 && next.getTime() <= Date.now(); i++) {
    next.setUTCDate(next.getUTCDate() + intervalDays);
  }
  return next.toISOString().slice(0, 10);
}

/** Per-ticker result, kept so a single failure never sinks the whole batch. */
type TickerOutcome =
  | { ok: true; holding: HoldingDividendForecast; suggestions: DividendSuggestion[] }
  | { ok: false; label: string };

export async function buildDividendForecast(): Promise<DividendForecast> {
  const assets = await getAssetRepository().list();
  let usdKrw = DEFAULT_USD_KRW;
  try {
    usdKrw = await fetchUsdKrwRate();
  } catch {
    // keep the fallback rate
  }
  const toKrw = (value: number, currency: string) =>
    currency === "USD" ? value * usdKrw : value;

  const stocks = assets.filter(
    (asset): asset is StockAsset =>
      asset.type === "STOCK" && !!asset.ticker && asset.ticker.trim() !== ""
  );

  // One upstream round-trip per ticker, so a 20-stock portfolio used to wait
  // for 20 of them end to end. They're independent — run a small pool instead.
  const outcomes = await mapWithConcurrency(
    stocks,
    DIVIDEND_FETCH_CONCURRENCY,
    async (asset): Promise<TickerOutcome> => {
      const ticker = asset.ticker!.trim();
      const owner = getAssetOwner(asset);
      try {
        const history = await fetchDividendHistory(ticker, asset.market);
        const trailing = trailingEvents(history.events, 365);
        const perShareTrailing12m = trailing.reduce((sum, e) => sum + e.amountPerShare, 0);
        const last = trailing[trailing.length - 1] ?? null;
        const valuationKrw = toKrw(history.price * asset.quantity, history.currency);

        return {
          ok: true,
          holding: {
            assetId: asset.id,
            name: asset.name,
            ticker,
            owner,
            quantity: asset.quantity,
            currency: history.currency,
            valuationKrw,
            perShareTrailing12m,
            perShareLast: last?.amountPerShare ?? 0,
            yieldPct:
              history.price > 0 && perShareTrailing12m > 0
                ? (perShareTrailing12m / history.price) * 100
                : null,
            annualEstimateKrw: toKrw(perShareTrailing12m * asset.quantity, history.currency),
            frequencyPerYear: trailing.length,
            lastExDate: last?.date ?? null,
            nextExDateEstimate: estimateNextExDate(trailing),
            nextAmountKrw: last
              ? toKrw(last.amountPerShare * asset.quantity, history.currency)
              : null,
          },
          // Recent past payouts (last ~6 months) offered as one-click records.
          suggestions: trailingEvents(history.events, 185).map((event) => ({
            assetId: asset.id,
            name: asset.name,
            ticker,
            owner,
            date: event.date,
            amount: event.amountPerShare * asset.quantity,
            currency: history.currency,
            amountKrw: toKrw(event.amountPerShare * asset.quantity, history.currency),
          })),
        };
      } catch {
        return { ok: false, label: `${asset.name} (${ticker})` };
      }
    }
  );

  // Collected in input order — completion order must not leak into the output.
  const holdings: HoldingDividendForecast[] = [];
  const suggestions: DividendSuggestion[] = [];
  const failedTickers: string[] = [];
  let quotedValuationKrw = 0;

  for (const outcome of outcomes) {
    if (!outcome.ok) {
      failedTickers.push(outcome.label);
      continue;
    }
    holdings.push(outcome.holding);
    suggestions.push(...outcome.suggestions);
    quotedValuationKrw += outcome.holding.valuationKrw;
  }

  holdings.sort((a, b) => b.annualEstimateKrw - a.annualEstimateKrw);
  suggestions.sort((a, b) => b.date.localeCompare(a.date));
  const totalAnnualKrw = holdings.reduce((sum, h) => sum + h.annualEstimateKrw, 0);

  return {
    holdings,
    totalAnnualKrw,
    quotedValuationKrw,
    portfolioYieldPct:
      quotedValuationKrw > 0 && totalAnnualKrw > 0
        ? (totalAnnualKrw / quotedValuationKrw) * 100
        : null,
    usdKrw,
    suggestions,
    failedTickers,
  };
}
