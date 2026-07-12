"use client";

import AssetSummary from "@/components/dashboard/AssetSummary";
import AssetsPreview from "@/components/dashboard/AssetsPreview";
import AllocationBreakdown from "@/components/dashboard/AllocationBreakdown";
import { usePortfolio } from "@/lib/portfolio-context";
import { getAllocationByType } from "@/lib/asset";

export default function DashboardPage() {
  const { assets, summary } = usePortfolio();
  const allocation = getAllocationByType(assets);

  return (
    <div className="flex flex-col">
      <AssetSummary summary={summary} />
      <AllocationBreakdown allocation={allocation} />
      <AssetsPreview assets={assets} />
    </div>
  );
}
