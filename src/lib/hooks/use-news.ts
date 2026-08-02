"use client";

import { useEffect, useState } from "react";
// type-only: the service module itself is server-only
import type { NewsResult } from "@/lib/services/news-service";

/**
 * Recent Korean economic/investment headlines for the 뉴스 page (read-only).
 *
 * `hasError` separates a failed request from "no article matched your
 * holdings" — both would otherwise render the same empty state, and only
 * one of them is worth retrying.
 */
export function useNews() {
  const [news, setNews] = useState<NewsResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/news")
      .then((response) => {
        if (!response.ok) throw new Error(`News request failed: ${response.status}`);
        return response.json();
      })
      .then((data: NewsResult) => {
        if (cancelled) return;
        setNews(data);
        // The route answers 200 even when no outlet responded, so treat
        // "every source failed" as an error. Partial failures are already
        // listed at the bottom of the page.
        setHasError(data.sources.length > 0 && data.failedSources.length === data.sources.length);
      })
      .catch(() => {
        if (cancelled) return;
        setNews(null);
        setHasError(true);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { news, isLoading, hasError };
}
