"use client";

import { useCallback, useEffect, useState } from "react";
import { PortfolioSnapshot } from "@/lib/models/snapshot";

/** Portfolio history for the trend chart, backed by /api/snapshots. */
export function useSnapshots() {
  const [snapshots, setSnapshots] = useState<PortfolioSnapshot[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/snapshots");
      if (!response.ok) return;
      setSnapshots(await response.json());
    } catch {
      // Chart is non-critical; keep whatever we had.
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  return { snapshots, isLoading, refresh };
}
