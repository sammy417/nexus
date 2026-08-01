"use client";

import { useEffect, useState } from "react";
// type-only: the service module itself is server-only
import type { NewsResult } from "@/lib/services/news-service";

/** Recent Korean economic/investment headlines for the 뉴스 page (read-only). */
export function useNews() {
  const [news, setNews] = useState<NewsResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/news")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!cancelled && data) setNews(data);
      })
      .catch(() => {
        // graceful: the page renders its empty/failure state
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { news, isLoading };
}
