import "server-only";

/**
 * Live price lookup via the (unofficial, key-less) Yahoo Finance chart
 * API. Covers both Korean and US listings with one endpoint:
 *   - 6-digit numeric tickers → KRX: `005930.KS` (KOSPI) / `.KQ` (KOSDAQ)
 *   - alphabetic tickers → US markets as-is: `AAPL`
 * USD quotes are converted to KRW with the USDKRW=X rate, since the app
 * stores all amounts in KRW.
 *
 * `QUOTE_API_BASE` overrides the upstream host (used by tests to point at
 * a local mock; also an escape hatch if the endpoint shape ever moves).
 * Failures throw — callers decide the fallback (the asset form falls back
 * to 평단가 / the previously stored price).
 */

const QUOTE_TTL_MS = 5 * 60 * 1000;

interface UpstreamQuote {
  price: number;
  currency: string;
}

interface CacheEntry extends UpstreamQuote {
  fetchedAt: number;
}

const globalForQuotes = globalThis as unknown as {
  __nexusQuoteCache?: Map<string, CacheEntry>;
};

function getCache(): Map<string, CacheEntry> {
  if (!globalForQuotes.__nexusQuoteCache) {
    globalForQuotes.__nexusQuoteCache = new Map();
  }
  return globalForQuotes.__nexusQuoteCache;
}

export function toQuoteSymbol(ticker: string, market?: string): string {
  const t = ticker.trim().toUpperCase();
  const m = (market ?? "").trim().toUpperCase();
  if (/^\d{6}$/.test(t)) {
    return m.includes("KOSDAQ") || m === "KQ" ? `${t}.KQ` : `${t}.KS`;
  }
  return t;
}

async function fetchUpstreamQuote(symbol: string): Promise<UpstreamQuote> {
  const cached = getCache().get(symbol);
  if (cached && Date.now() - cached.fetchedAt < QUOTE_TTL_MS) {
    return cached;
  }

  const base = process.env.QUOTE_API_BASE ?? "https://query1.finance.yahoo.com";
  const url = `${base}/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1d`;
  const response = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; nexus-portfolio)" },
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Quote lookup failed for ${symbol} (upstream ${response.status})`);
  }

  const data = await response.json();
  const meta = data?.chart?.result?.[0]?.meta;
  const price = meta?.regularMarketPrice;
  const currency = meta?.currency;
  if (typeof price !== "number" || !Number.isFinite(price) || typeof currency !== "string") {
    throw new Error(`Quote lookup returned no usable price for ${symbol}`);
  }

  const entry: CacheEntry = { price, currency, fetchedAt: Date.now() };
  getCache().set(symbol, entry);
  return entry;
}

/** Current USDKRW rate (cached like any other quote). */
export async function fetchUsdKrwRate(): Promise<number> {
  const fx = await fetchUpstreamQuote("USDKRW=X");
  return fx.price;
}

export interface QuoteResult {
  /** Price in the security's own trading currency. */
  price: number;
  /** Currency the security itself trades in, e.g. "USD". */
  currency: string;
  /** Price converted to KRW (rounded to whole won). */
  priceKrw: number;
  /** USDKRW rate used for the conversion (also returned for KRW quotes). */
  usdKrw: number;
  /** The upstream symbol that was queried, e.g. "005930.KS". */
  symbol: string;
}

export async function fetchQuoteKrw(ticker: string, market?: string): Promise<QuoteResult> {
  const symbol = toQuoteSymbol(ticker, market);
  const quote = await fetchUpstreamQuote(symbol);
  const usdKrw = await fetchUsdKrwRate();

  if (quote.currency === "KRW") {
    return { price: quote.price, currency: quote.currency, priceKrw: Math.round(quote.price), usdKrw, symbol };
  }
  if (quote.currency === "USD") {
    return {
      price: quote.price,
      currency: quote.currency,
      priceKrw: Math.round(quote.price * usdKrw),
      usdKrw,
      symbol,
    };
  }
  throw new Error(`Unsupported quote currency ${quote.currency} for ${symbol}`);
}
