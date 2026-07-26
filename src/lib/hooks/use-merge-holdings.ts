"use client";

import { useEffect, useState } from "react";

/** Shared preference so the toggle stays consistent across menus. */
const MERGE_STORAGE_KEY = "nexus:merge-holdings";

/**
 * "같은 종목 합산" toggle state, persisted to localStorage and shared by the
 * portfolio and stock menus.
 */
export function useMergeHoldings() {
  const [mergeSame, setMergeSame] = useState(false);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (window.localStorage.getItem(MERGE_STORAGE_KEY) === "1") setMergeSame(true);
    } catch {
      // ignore storage failures
    }
  }, []);

  function toggle() {
    setMergeSame((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(MERGE_STORAGE_KEY, next ? "1" : "0");
      } catch {
        // ignore storage failures
      }
      return next;
    });
  }

  return { mergeSame, toggle };
}
