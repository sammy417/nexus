"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { assets as seedAssets } from "./dummy-data";
import { getPortfolioSummary, PortfolioSummary } from "./asset";
import { Asset } from "./types";

const STORAGE_KEY = "nexus:assets:v2";

export type AssetInput =
  | { type: "STOCK"; name: string; ticker?: string; quantity: number; avgPrice: number; currentPrice: number }
  | { type: "CASH"; name: string; amount: number }
  | { type: "REAL_ESTATE"; name: string; purchasePrice: number; currentValue: number };

interface PortfolioContextValue {
  assets: Asset[];
  summary: PortfolioSummary;
  addAsset: (input: AssetInput) => void;
  updateAsset: (id: string, input: AssetInput) => void;
  deleteAsset: (id: string) => void;
  resetPortfolio: () => void;
}

const PortfolioContext = createContext<PortfolioContextValue | null>(null);

function loadStoredAssets(): Asset[] | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
  const [assets, setAssets] = useState<Asset[]>(seedAssets);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Seed state is used for the SSR/hydration render to avoid a mismatch;
    // localStorage is only readable client-side, so it's applied post-mount.
    const stored = loadStoredAssets();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored) setAssets(stored);
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(assets));
  }, [assets, isHydrated]);

  function addAsset(input: AssetInput) {
    const newAsset = { ...input, id: crypto.randomUUID() } as Asset;
    setAssets([newAsset, ...assets]);
  }

  function updateAsset(id: string, input: AssetInput) {
    setAssets(assets.map((asset) => (asset.id === id ? ({ ...input, id } as Asset) : asset)));
  }

  function deleteAsset(id: string) {
    setAssets(assets.filter((asset) => asset.id !== id));
  }

  function resetPortfolio() {
    setAssets(seedAssets);
  }

  const summary = getPortfolioSummary(assets);

  return (
    <PortfolioContext.Provider
      value={{ assets, summary, addAsset, updateAsset, deleteAsset, resetPortfolio }}
    >
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error("usePortfolio must be used within a PortfolioProvider");
  }
  return context;
}
