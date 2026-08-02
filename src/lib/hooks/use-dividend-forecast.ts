"use client";

import { useEffect, useState } from "react";
// type-only: the service module itself is server-only
import type { DividendForecast } from "@/lib/services/dividend-forecast-service";

/**
 * External-data dividend estimates for the 배당 page (read-only).
 *
 * `hasError` distinguishes "the lookup failed" from "there is genuinely
 * nothing to show" — without it a failed request looks identical to a
 * portfolio that pays no dividends, which silently understates the tax
 * page's year-end projection.
 */
export function useDividendForecast() {
  const [forecast, setForecast] = useState<DividendForecast | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/dividends/forecast")
      .then((response) => {
        if (!response.ok) throw new Error(`Forecast request failed: ${response.status}`);
        return response.json();
      })
      .then((data: DividendForecast) => {
        if (cancelled) return;
        setForecast(data);
        // The route answers 200 even when every ticker lookup failed, so a
        // total wipeout only shows up as "everything failed, nothing came
        // back". Partial failures stay visible via `failedTickers` in the
        // cards themselves.
        setHasError(data.failedTickers.length > 0 && data.holdings.length === 0);
      })
      .catch(() => {
        if (cancelled) return;
        setForecast(null);
        setHasError(true);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { forecast, isLoading, hasError };
}
