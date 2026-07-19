"use client";

import { useEffect, useState } from "react";
// type-only: the service module itself is server-only
import type { DividendForecast } from "@/lib/services/dividend-forecast-service";

/** External-data dividend estimates for the 배당 page (read-only). */
export function useDividendForecast() {
  const [forecast, setForecast] = useState<DividendForecast | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/dividends/forecast")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!cancelled && data) setForecast(data);
      })
      .catch(() => {
        // graceful: cards render their empty/failure state
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { forecast, isLoading };
}
