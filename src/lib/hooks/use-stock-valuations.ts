"use client";

import { useEffect, useMemo, useState } from "react";
import { StockAsset } from "@/lib/models/asset";
import { StockValuation } from "@/lib/models/stock-valuation";

/**
 * Fetches valuation metrics (P/E, P/B, market cap, …) for the given stocks'
 * tickers in one batch. Keyed by uppercased ticker, so two lots of the same
 * ticker share one lookup. Best-effort — missing tickers are just absent.
 */
export function useStockValuations(stocks: StockAsset[]) {
  const [valuations, setValuations] = useState<Record<string, StockValuation>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Unique {ticker, market} for stocks that actually have a ticker.
  const refs = useMemo(() => {
    const seen = new Map<string, { ticker: string; market?: string }>();
    for (const s of stocks) {
      const ticker = s.ticker?.trim();
      if (!ticker) continue;
      const key = ticker.toUpperCase();
      if (!seen.has(key)) seen.set(key, { ticker, market: s.market });
    }
    return [...seen.values()];
  }, [stocks]);

  const refsKey = refs.map((r) => `${r.ticker}|${r.market ?? ""}`).join(",");

  useEffect(() => {
    if (refs.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setValuations({});
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    fetch("/api/stocks/valuations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tickers: refs }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled) setValuations(data?.valuations ?? {});
      })
      .catch(() => {
        if (!cancelled) setValuations({});
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // refsKey captures the meaningful change; refs identity is stable per key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refsKey]);

  return { valuations, isLoading };
}
