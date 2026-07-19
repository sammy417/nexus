"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { OwnerFilter } from "@/lib/models/asset-owner";

const STORAGE_KEY = "nexus:owner-filter";

interface OwnerFilterContextValue {
  /** Whose assets the dashboard/portfolio/analytics views show. */
  ownerFilter: OwnerFilter;
  setOwnerFilter: (filter: OwnerFilter) => void;
}

const OwnerFilterContext = createContext<OwnerFilterContextValue | null>(null);

export function OwnerFilterProvider({ children }: { children: React.ReactNode }) {
  const [ownerFilter, setOwnerFilterState] = useState<OwnerFilter>("ALL");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "SELF" || stored === "SPOUSE" || stored === "JOINT" || stored === "ALL") {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setOwnerFilterState(stored);
      }
    } catch {
      // ignore storage failures
    }
  }, []);

  const setOwnerFilter = useCallback((filter: OwnerFilter) => {
    setOwnerFilterState(filter);
    try {
      window.localStorage.setItem(STORAGE_KEY, filter);
    } catch {
      // ignore storage failures
    }
  }, []);

  const value = useMemo(() => ({ ownerFilter, setOwnerFilter }), [ownerFilter, setOwnerFilter]);

  return <OwnerFilterContext.Provider value={value}>{children}</OwnerFilterContext.Provider>;
}

export function useOwnerFilter() {
  const context = useContext(OwnerFilterContext);
  if (!context) {
    throw new Error("useOwnerFilter must be used within an OwnerFilterProvider");
  }
  return context;
}
