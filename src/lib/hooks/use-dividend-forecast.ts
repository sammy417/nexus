"use client";

import { useCallback, useEffect, useState } from "react";
// type-only: the service module itself is server-only
import type { DividendForecast } from "@/lib/services/dividend-forecast-service";

/**
 * External-data dividend estimates, shared by the 대시보드 · 배당 · 세금 pages.
 *
 * The underlying request fans out to one upstream lookup per ticker, so it's
 * the most expensive call in the app — and all three pages want the same
 * answer. The module-level cache below means the first page pays for it and
 * the other two render from memory; without it, moving between the three
 * refetched everything each time.
 *
 * `hasError` distinguishes "the lookup failed" from "there is genuinely
 * nothing to show" — without it a failed request looks identical to a
 * portfolio that pays no dividends, which silently understates the tax
 * page's year-end projection.
 */

/**
 * Well under the server's 1h dividend cache: long enough to cover moving
 * between the three pages, short enough that a long-lived tab doesn't sit on
 * a stale forecast. Asset edits invalidate it explicitly regardless.
 */
const FORECAST_TTL_MS = 5 * 60 * 1000;

let cached: { data: DividendForecast; fetchedAt: number } | null = null;
let inflight: Promise<DividendForecast> | null = null;
const listeners = new Set<() => void>();

function freshCache(): DividendForecast | null {
  if (!cached) return null;
  return Date.now() - cached.fetchedAt < FORECAST_TTL_MS ? cached.data : null;
}

function loadForecast(): Promise<DividendForecast> {
  const fresh = freshCache();
  if (fresh) return Promise.resolve(fresh);
  // A page mounting while another is still waiting joins that request
  // instead of starting a second one.
  if (inflight) return inflight;

  inflight = fetch("/api/dividends/forecast")
    .then((response) => {
      if (!response.ok) throw new Error(`Forecast request failed: ${response.status}`);
      return response.json() as Promise<DividendForecast>;
    })
    .then((data) => {
      cached = { data, fetchedAt: Date.now() };
      return data;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/**
 * Drop the shared forecast and reload it wherever it's mounted. Called after
 * an asset changes — holdings drive the whole estimate, so a cached forecast
 * is wrong the moment one is added, edited or deleted.
 */
export function invalidateDividendForecast(): void {
  cached = null;
  inflight = null;
  for (const listener of [...listeners]) listener();
}

export function useDividendForecast() {
  // Seeded from the shared cache so arriving from another page renders the
  // forecast immediately instead of flashing the loading state.
  const [forecast, setForecast] = useState<DividendForecast | null>(freshCache);
  const [isLoading, setIsLoading] = useState(() => freshCache() === null);
  const [hasError, setHasError] = useState(false);
  const [revision, setRevision] = useState(0);

  const reload = useCallback(() => setRevision((value) => value + 1), []);

  useEffect(() => {
    listeners.add(reload);
    return () => {
      listeners.delete(reload);
    };
  }, [reload]);

  useEffect(() => {
    let cancelled = false;
    loadForecast()
      .then((data) => {
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
    // On invalidation the previous forecast stays on screen until the new one
    // lands — a reload is a refresh, not a fresh empty page.
  }, [revision]);

  return { forecast, isLoading, hasError };
}
