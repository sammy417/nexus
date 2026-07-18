"use client";

import { useCallback, useEffect, useState } from "react";
import { DividendInput, DividendRecord } from "@/lib/models/dividend";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? `Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

/** Client-side data access for dividends, backed by /api/dividends. */
export function useDividends() {
  const [dividends, setDividends] = useState<DividendRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setDividends(await request<DividendRecord[]>("/api/dividends"));
    } catch {
      // keep whatever we had
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  const addDividend = useCallback(async (input: DividendInput) => {
    const record = await request<DividendRecord>("/api/dividends", {
      method: "POST",
      body: JSON.stringify(input),
    });
    setDividends((prev) =>
      [record, ...prev].sort((a, b) => b.date.localeCompare(a.date))
    );
    return record;
  }, []);

  const deleteDividend = useCallback(async (id: string) => {
    await request<{ ok: true }>(`/api/dividends/${id}`, { method: "DELETE" });
    setDividends((prev) => prev.filter((record) => record.id !== id));
  }, []);

  return { dividends, isLoading, addDividend, deleteDividend };
}
