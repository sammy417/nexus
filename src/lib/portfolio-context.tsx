"use client";

import { createContext, useContext, useMemo } from "react";
import { useAssets } from "@/lib/hooks/use-assets";
import { getPortfolioSummary, PortfolioSummary } from "@/lib/services/portfolio-service";
import { Asset, AssetInput } from "@/lib/models/asset";

export type { AssetInput } from "@/lib/models/asset";

interface PortfolioContextValue {
  assets: Asset[];
  isLoading: boolean;
  error: string | null;
  summary: PortfolioSummary;
  addAsset: (input: AssetInput) => Promise<Asset>;
  updateAsset: (id: string, input: AssetInput) => Promise<Asset>;
  deleteAsset: (id: string) => Promise<void>;
  resetPortfolio: () => Promise<void>;
}

const PortfolioContext = createContext<PortfolioContextValue | null>(null);

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
  const { assets, isLoading, error, addAsset, updateAsset, deleteAsset, resetAssets } = useAssets();
  const summary = useMemo(() => getPortfolioSummary(assets), [assets]);

  const value = useMemo(
    () => ({
      assets,
      isLoading,
      error,
      summary,
      addAsset,
      updateAsset,
      deleteAsset,
      resetPortfolio: resetAssets,
    }),
    [assets, isLoading, error, summary, addAsset, updateAsset, deleteAsset, resetAssets]
  );

  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>;
}

export function usePortfolio() {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error("usePortfolio must be used within a PortfolioProvider");
  }
  return context;
}
