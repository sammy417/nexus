"use client";

import { useEffect, useMemo, useState } from "react";
import { StockAsset } from "@/lib/models/asset";
import { StockValuation } from "@/lib/models/stock-valuation";

/**
 * Fetches valuation metrics (P/E, P/B, market cap, …) for the given stocks'
 * tickers in one batch. Keyed by uppercased ticker, so two lots of the same
 * ticker share one lookup. Best-effort — missing tickers are just absent.
 *
 * `hasError` marks a failed request so the table can say "couldn't load"
 * rather than showing an empty comparison that looks like real data.
 */
export function useStockValuations(stocks: StockAsset[]) {
  const [valuations, setValuations] = useState<Record<string, StockValuation>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

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
      setHasError(false);
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
      .then((r) => {
        if (!r.ok) throw new Error(`Valuation request failed: ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        setValuations(data?.valuations ?? {});
        // The route answers 200 even when every upstream lookup failed, so
        // the real signal is the per-ticker `failed` list, not the status.
        setHasError((data?.failed?.length ?? 0) > 0);
      })
      .catch(() => {
        if (cancelled) return;
        setValuations({});
        setHasError(true);
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

  return { valuations, isLoading, hasError };
}
