"use client";

import { useEffect, useMemo, useState } from "react";
import { StockAsset } from "@/lib/models/asset";
import { ClosePoint } from "@/lib/models/stock-history";

/**
 * Fetches ~1 year of daily closes for the given stocks' tickers in one batch,
 * keyed by uppercased ticker. Feeds volatility / correlation analysis.
 */
export function useStockHistory(stocks: StockAsset[]) {
  const [history, setHistory] = useState<Record<string, ClosePoint[]>>({});
  const [isLoading, setIsLoading] = useState(true);

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
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled) setHistory(data?.series ?? {});
      })
      .catch(() => {
        if (!cancelled) setHistory({});
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refsKey]);

  return { history, isLoading };
}
