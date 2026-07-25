"use client";

import { useCallback, useEffect, useState } from "react";
import { Asset, AssetInput } from "@/lib/models/asset";

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

/** Client-side data access for assets, backed by the /api/assets route handlers. */
export function useAssets() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await request<Asset[]>("/api/assets");
      setAssets(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "자산 정보를 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  const addAsset = useCallback(async (input: AssetInput) => {
    const asset = await request<Asset>("/api/assets", {
      method: "POST",
      body: JSON.stringify(input),
    });
    setAssets((prev) => [...prev, asset]);
    return asset;
  }, []);

  const updateAsset = useCallback(async (id: string, input: AssetInput) => {
    const asset = await request<Asset>(`/api/assets/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
    setAssets((prev) => prev.map((item) => (item.id === id ? asset : item)));
    return asset;
  }, []);

  const deleteAsset = useCallback(async (id: string) => {
    await request<{ ok: true }>(`/api/assets/${id}`, { method: "DELETE" });
    setAssets((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const resetAssets = useCallback(async () => {
    const data = await request<Asset[]>("/api/assets/reset", { method: "POST" });
    setAssets(data);
  }, []);

  return { assets, isLoading, error, refresh, addAsset, updateAsset, deleteAsset, resetAssets };
}
