import "server-only";
import type { StockValuation } from "@/lib/models/stock-valuation";

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

// --- Dividend history (chart endpoint with events=div) ---

const DIVIDEND_TTL_MS = 60 * 60 * 1000;

export interface DividendEvent {
  /** Ex-dividend date, YYYY-MM-DD. */
  date: string;
  /** Per-share amount in the security's trading currency. */
  amountPerShare: number;
}

export interface DividendHistory {
  symbol: string;
  currency: string;
  /** Current price in the trading currency (same response as the events). */
  price: number;
  /** Ex-dates over the requested range, oldest first. */
  events: DividendEvent[];
}

interface DividendCacheEntry extends DividendHistory {
  fetchedAt: number;
}

const globalForDividends = globalThis as unknown as {
  __nexusDividendHistoryCache?: Map<string, DividendCacheEntry>;
};

function getDividendCache(): Map<string, DividendCacheEntry> {
  if (!globalForDividends.__nexusDividendHistoryCache) {
    globalForDividends.__nexusDividendHistoryCache = new Map();
  }
  return globalForDividends.__nexusDividendHistoryCache;
}

/** Trailing ~13 months of dividend events for a ticker (1h cache). */
export async function fetchDividendHistory(
  ticker: string,
  market?: string
): Promise<DividendHistory> {
  const symbol = toQuoteSymbol(ticker, market);
  const cached = getDividendCache().get(symbol);
  if (cached && Date.now() - cached.fetchedAt < DIVIDEND_TTL_MS) {
    return cached;
  }

  const base = process.env.QUOTE_API_BASE ?? "https://query1.finance.yahoo.com";
  const url = `${base}/v8/finance/chart/${encodeURIComponent(symbol)}?range=13mo&interval=1mo&events=div`;
  const response = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; nexus-portfolio)" },
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Dividend lookup failed for ${symbol} (upstream ${response.status})`);
  }

  const data = await response.json();
  const result = data?.chart?.result?.[0];
  const meta = result?.meta;
  if (typeof meta?.regularMarketPrice !== "number" || typeof meta?.currency !== "string") {
    throw new Error(`Dividend lookup returned no usable metadata for ${symbol}`);
  }

  const rawEvents = result?.events?.dividends ?? {};
  const events: DividendEvent[] = Object.values(
    rawEvents as Record<string, { amount?: number; date?: number }>
  )
    .filter(
      (event) =>
        typeof event.amount === "number" &&
        Number.isFinite(event.amount) &&
        typeof event.date === "number"
    )
    .map((event) => ({
      date: new Date(event.date! * 1000).toISOString().slice(0, 10),
      amountPerShare: event.amount!,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const entry: DividendCacheEntry = {
    symbol,
    currency: meta.currency,
    price: meta.regularMarketPrice,
    events,
    fetchedAt: Date.now(),
  };
  getDividendCache().set(symbol, entry);
  return entry;
}

// --- Company profile (sector) via quoteSummary assetProfile ---

const PROFILE_TTL_MS = 24 * 60 * 60 * 1000;

const globalForProfiles = globalThis as unknown as {
  __nexusStockProfileCache?: Map<string, { sector?: string; fetchedAt: number }>;
};

function getProfileCache(): Map<string, { sector?: string; fetchedAt: number }> {
  if (!globalForProfiles.__nexusStockProfileCache) {
    globalForProfiles.__nexusStockProfileCache = new Map();
  }
  return globalForProfiles.__nexusStockProfileCache;
}

/**
 * Best-effort sector lookup (Yahoo `quoteSummary` assetProfile). Returns the
 * raw upstream sector string (English); callers normalize it. 24h cache.
 * Throws on failure — the sector is optional, so callers should catch.
 */
export async function fetchStockSector(ticker: string, market?: string): Promise<string | undefined> {
  const symbol = toQuoteSymbol(ticker, market);
  const cached = getProfileCache().get(symbol);
  if (cached && Date.now() - cached.fetchedAt < PROFILE_TTL_MS) {
    return cached.sector;
  }

  const base = process.env.QUOTE_API_BASE ?? "https://query1.finance.yahoo.com";
  const url = `${base}/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=assetProfile`;
  const response = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; nexus-portfolio)" },
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Profile lookup failed for ${symbol} (upstream ${response.status})`);
  }

  const data = await response.json();
  const raw = data?.quoteSummary?.result?.[0]?.assetProfile?.sector;
  const sector = typeof raw === "string" && raw.trim() ? raw.trim() : undefined;
  getProfileCache().set(symbol, { sector, fetchedAt: Date.now() });
  return sector;
}

// --- Valuation / fundamentals via quoteSummary ---

const VALUATION_TTL_MS = 60 * 60 * 1000;

const globalForValuations = globalThis as unknown as {
  __nexusValuationCache?: Map<string, { value: StockValuation; fetchedAt: number }>;
};

function getValuationCache() {
  if (!globalForValuations.__nexusValuationCache) {
    globalForValuations.__nexusValuationCache = new Map();
  }
  return globalForValuations.__nexusValuationCache;
}

function rawNumber(node: unknown): number | null {
  const raw = (node as { raw?: unknown } | undefined)?.raw;
  return typeof raw === "number" && Number.isFinite(raw) ? raw : null;
}

/** Best-effort valuation metrics (Yahoo quoteSummary). 1h cache; throws on failure. */
export async function fetchStockValuation(ticker: string, market?: string): Promise<StockValuation> {
  const symbol = toQuoteSymbol(ticker, market);
  const cached = getValuationCache().get(symbol);
  if (cached && Date.now() - cached.fetchedAt < VALUATION_TTL_MS) {
    return cached.value;
  }

  const base = process.env.QUOTE_API_BASE ?? "https://query1.finance.yahoo.com";
  const modules = "summaryDetail,defaultKeyStatistics,price";
  const url = `${base}/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=${modules}`;
  const response = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; nexus-portfolio)" },
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Valuation lookup failed for ${symbol} (upstream ${response.status})`);
  }

  const result = (await response.json())?.quoteSummary?.result?.[0] ?? {};
  const detail = result.summaryDetail ?? {};
  const stats = result.defaultKeyStatistics ?? {};
  const price = result.price ?? {};
  const yieldRaw = rawNumber(detail.dividendYield);

  const value: StockValuation = {
    per: rawNumber(detail.trailingPE) ?? rawNumber(stats.trailingPE),
    pbr: rawNumber(stats.priceToBook),
    marketCap: rawNumber(detail.marketCap) ?? rawNumber(price.marketCap),
    dividendYield: yieldRaw === null ? null : yieldRaw * 100,
    fiftyTwoWeekHigh: rawNumber(detail.fiftyTwoWeekHigh),
    fiftyTwoWeekLow: rawNumber(detail.fiftyTwoWeekLow),
    price: rawNumber(price.regularMarketPrice),
    currency: typeof price.currency === "string" ? price.currency : null,
  };
  getValuationCache().set(symbol, { value, fetchedAt: Date.now() });
  return value;
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
