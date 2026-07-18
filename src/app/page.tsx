"use client";

import AssetSummary from "@/components/dashboard/AssetSummary";
import AssetsPreview from "@/components/dashboard/AssetsPreview";
import AllocationBreakdown from "@/components/dashboard/AllocationBreakdown";
import TrendChart from "@/components/dashboard/TrendChart";
import CurrencyToggle from "@/components/common/CurrencyToggle";
import { usePortfolio } from "@/lib/portfolio-context";
import { useDisplayCurrency } from "@/lib/currency-context";
import { getAllocationByCategory } from "@/lib/services/portfolio-service";

export default function DashboardPage() {
  const { assets, snapshots, summary, isLoading } = usePortfolio();
  const { usdKrw } = useDisplayCurrency();
  const allocation = getAllocationByCategory(assets, usdKrw);

  if (isLoading) {
    return <p className="py-24 text-center text-sm text-gray-400 dark:text-gray-500">불러오는 중...</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">대시보드</h1>
        <CurrencyToggle />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AssetSummary summary={summary} />
        </div>
        <AllocationBreakdown allocation={allocation} />
        <div className="lg:col-span-3">
          <TrendChart snapshots={snapshots} />
        </div>
        <div className="lg:col-span-3">
          <AssetsPreview assets={assets} />
        </div>
      </div>
    </div>
  );
}
