"use client";

import AssetSummary from "@/components/dashboard/AssetSummary";
import AssetsPreview from "@/components/dashboard/AssetsPreview";
import AllocationBreakdown from "@/components/dashboard/AllocationBreakdown";
import { usePortfolio } from "@/lib/portfolio-context";
import { getAllocationByType } from "@/lib/services/portfolio-service";

export default function DashboardPage() {
  const { assets, summary, isLoading } = usePortfolio();
  const allocation = getAllocationByType(assets);

  if (isLoading) {
    return <p className="py-24 text-center text-sm text-gray-400 dark:text-gray-500">불러오는 중...</p>;
  }

  return (
    <div className="flex flex-col">
      <AssetSummary summary={summary} />
      <AllocationBreakdown allocation={allocation} />
      <AssetsPreview assets={assets} />
    </div>
  );
}
