"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import { useAssets } from "@/lib/hooks/use-assets";
import { useSnapshots } from "@/lib/hooks/use-snapshots";
import { useDisplayCurrency } from "@/lib/currency-context";
import { useOwnerFilter } from "@/lib/owner-filter-context";
import { matchesOwnerFilter } from "@/lib/models/asset-owner";
import { getPortfolioSummary, PortfolioSummary } from "@/lib/services/portfolio-service";
import { Asset, AssetInput } from "@/lib/models/asset";
import { PortfolioSnapshot } from "@/lib/models/snapshot";

export type { AssetInput } from "@/lib/models/asset";

interface PortfolioContextValue {
  /** Assets scoped by the active owner filter. */
  assets: Asset[];
  /** Every household asset, regardless of the owner filter. */
  allAssets: Asset[];
  snapshots: PortfolioSnapshot[];
  isLoading: boolean;
  error: string | null;
  summary: PortfolioSummary;
  addAsset: (input: AssetInput) => Promise<Asset>;
  updateAsset: (id: string, input: AssetInput) => Promise<Asset>;
  deleteAsset: (id: string) => Promise<void>;
  resetPortfolio: () => Promise<void>;
  /** Reload assets + history from the server (e.g. after a price refresh). */
  refreshData: () => Promise<void>;
}

const PortfolioContext = createContext<PortfolioContextValue | null>(null);

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
  const {
    assets: allAssets,
    isLoading,
    error,
    refresh: refreshAssets,
    addAsset,
    updateAsset,
    deleteAsset,
    resetAssets,
  } = useAssets();
  const { snapshots, refresh: refreshSnapshots } = useSnapshots();
  const { usdKrw } = useDisplayCurrency();
  const { ownerFilter } = useOwnerFilter();

  // The household owner filter scopes every consumer (dashboard totals,
  // allocation, portfolio, analytics) — "ALL" is the combined view.
  const assets = useMemo(
    () => allAssets.filter((asset) => matchesOwnerFilter(asset, ownerFilter)),
    [allAssets, ownerFilter]
  );
  const summary = useMemo(() => getPortfolioSummary(assets, usdKrw), [assets, usdKrw]);

  // Every mutation moves today's snapshot server-side, so refresh the
  // history alongside the asset list to keep the chart's last point live.
  const addAssetAndSync = useCallback(
    async (input: AssetInput) => {
      const asset = await addAsset(input);
      refreshSnapshots();
      return asset;
    },
    [addAsset, refreshSnapshots]
  );

  const updateAssetAndSync = useCallback(
    async (id: string, input: AssetInput) => {
      const asset = await updateAsset(id, input);
      refreshSnapshots();
      return asset;
    },
    [updateAsset, refreshSnapshots]
  );

  const deleteAssetAndSync = useCallback(
    async (id: string) => {
      await deleteAsset(id);
      refreshSnapshots();
    },
    [deleteAsset, refreshSnapshots]
  );

  const resetPortfolio = useCallback(async () => {
    await resetAssets();
    refreshSnapshots();
  }, [resetAssets, refreshSnapshots]);

  const refreshData = useCallback(async () => {
    await Promise.all([refreshAssets(), refreshSnapshots()]);
  }, [refreshAssets, refreshSnapshots]);

  const value = useMemo(
    () => ({
      assets,
      allAssets,
      snapshots,
      isLoading,
      error,
      summary,
      addAsset: addAssetAndSync,
      updateAsset: updateAssetAndSync,
      deleteAsset: deleteAssetAndSync,
      resetPortfolio,
      refreshData,
    }),
    [
      assets,
      allAssets,
      snapshots,
      isLoading,
      error,
      summary,
      addAssetAndSync,
      updateAssetAndSync,
      deleteAssetAndSync,
      resetPortfolio,
      refreshData,
    ]
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
