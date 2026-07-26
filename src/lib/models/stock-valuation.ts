/** Valuation / fundamentals for a stock (from Yahoo quoteSummary). */
export interface StockValuation {
  /** Trailing P/E. */
  per: number | null;
  /** Price / book. */
  pbr: number | null;
  /** Market cap in the stock's trading currency. */
  marketCap: number | null;
  /** Dividend yield in percent (e.g. 2.5). */
  dividendYield: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  price: number | null;
  currency: string | null;
}

/** Compact market-cap string in the stock's trading currency. */
export function formatMarketCap(value: number, currency: string | null): string {
  const usd = currency === "USD";
  if (usd) {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(0)}M`;
    return `$${Math.round(value).toLocaleString("en-US")}`;
  }
  if (value >= 1e12) return `${(value / 1e12).toFixed(1)}조`;
  if (value >= 1e8) return `${Math.round(value / 1e8).toLocaleString("ko-KR")}억`;
  return `₩${Math.round(value).toLocaleString("ko-KR")}`;
}
