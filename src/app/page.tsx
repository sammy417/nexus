"use client";

import AssetSummary from "@/components/dashboard/AssetSummary";
import AssetsPreview from "@/components/dashboard/AssetsPreview";
import AllocationBreakdown from "@/components/dashboard/AllocationBreakdown";
import OwnerBreakdown from "@/components/dashboard/OwnerBreakdown";
import TrendChart from "@/components/dashboard/TrendChart";
import CurrencyToggle from "@/components/common/CurrencyToggle";
import OwnerFilterToggle from "@/components/common/OwnerFilterToggle";
import RefreshPricesButton from "@/components/common/RefreshPricesButton";
import { usePortfolio } from "@/lib/portfolio-context";
import { useDisplayCurrency } from "@/lib/currency-context";
import { useOwnerFilter } from "@/lib/owner-filter-context";
import { getAllocationByCategory, getAllocationByOwner } from "@/lib/services/portfolio-service";

export default function DashboardPage() {
  const { assets, allAssets, snapshots, summary, isLoading } = usePortfolio();
  const { usdKrw } = useDisplayCurrency();
  const { ownerFilter } = useOwnerFilter();
  const allocation = getAllocationByCategory(assets, usdKrw);
  // Household split stays ALL-based on purpose — it answers "whose share
  // of the whole", which a filtered view can't.
  const ownerAllocation = getAllocationByOwner(allAssets, usdKrw);

  if (isLoading) {
    return <p className="py-24 text-center text-sm text-gray-400 dark:text-gray-500">불러오는 중...</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">대시보드</h1>
        <div className="flex items-center gap-3">
          <RefreshPricesButton />
          <OwnerFilterToggle />
          <CurrencyToggle />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AssetSummary summary={summary} />
        </div>
        <AllocationBreakdown allocation={allocation} />
        <div className="lg:col-span-3">
          {ownerFilter !== "ALL" && (
            <p className="mb-2 px-1 text-[11px] text-gray-400 dark:text-gray-500">
              총 자산 추이는 전체(합산) 기준입니다 — 소유자별 히스토리는 아직 기록되지 않습니다.
            </p>
          )}
          <TrendChart snapshots={snapshots} />
        </div>
        <OwnerBreakdown allocation={ownerAllocation} />
        <div className="lg:col-span-2">
          <AssetsPreview assets={assets} />
        </div>
      </div>
    </div>
  );
}
