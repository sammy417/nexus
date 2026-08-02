"use client";

import { useEffect, useMemo, useState } from "react";
import { StockAsset } from "@/lib/models/asset";
import { ClosePoint } from "@/lib/models/stock-history";

/**
 * Fetches ~1 year of daily closes for the given stocks' tickers in one batch,
 * keyed by uppercased ticker. Feeds volatility / correlation analysis.
 *
 * `hasError` marks a failed request so risk metrics can say "couldn't load"
 * instead of implying the holdings simply have no price history.
 */
export function useStockHistory(stocks: StockAsset[]) {
  const [history, setHistory] = useState<Record<string, ClosePoint[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

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
      setHistory({});
      setHasError(false);
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    fetch("/api/stocks/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tickers: refs }),
    })
      .then((r) => {
        if (!r.ok) throw new Error(`History request failed: ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        setHistory(data?.series ?? {});
        // The route answers 200 even when every upstream lookup failed, so
        // the real signal is the per-ticker `failed` list, not the status.
        setHasError((data?.failed?.length ?? 0) > 0);
      })
      .catch(() => {
        if (cancelled) return;
        setHistory({});
        setHasError(true);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refsKey]);

  return { history, isLoading, hasError };
}
