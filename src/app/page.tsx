"use client";

import AssetSummary from "@/components/dashboard/AssetSummary";
import AssetsPreview from "@/components/dashboard/AssetsPreview";
import AllocationBreakdown from "@/components/dashboard/AllocationBreakdown";
import OwnerBreakdown from "@/components/dashboard/OwnerBreakdown";
import TrendChart from "@/components/dashboard/TrendChart";
import DashboardOnboarding from "@/components/dashboard/DashboardOnboarding";
import CurrencyToggle from "@/components/common/CurrencyToggle";
import OwnerFilterToggle from "@/components/common/OwnerFilterToggle";
import RefreshPricesButton from "@/components/common/RefreshPricesButton";
import DashboardSkeleton from "@/components/skeletons/DashboardSkeleton";
import { usePortfolio } from "@/lib/portfolio-context";
import { useDisplayCurrency } from "@/lib/currency-context";
import { useOwnerFilter } from "@/lib/owner-filter-context";
import { useSettings } from "@/lib/settings-context";
import { useT } from "@/lib/i18n/locale-context";
import {
  getAllocationByCategory,
  getAllocationByOwner,
  getPortfolioSummary,
} from "@/lib/services/portfolio-service";
import { selectOwnerHistory } from "@/lib/services/owner-history";

export default function DashboardPage() {
  const { assets, allAssets, snapshots, summary, isLoading } = usePortfolio();
  const { usdKrw } = useDisplayCurrency();
  const { ownerFilter } = useOwnerFilter();
  const { ownerColor } = useSettings();
  const t = useT();
  const allocation = getAllocationByCategory(assets, usdKrw);
  // Household split stays ALL-based on purpose — it answers "whose share
  // of the whole", which a filtered view can't.
  const ownerAllocation = getAllocationByOwner(allAssets, usdKrw);

  // Owner-scoped history: real byOwner where stored, else scaled by the
  // owner's current share of the household.
  const household = getPortfolioSummary(allAssets, usdKrw);
  const fallbackShare = {
    principal: household.totalPrincipal === 0 ? 0 : summary.totalPrincipal / household.totalPrincipal,
    valuation: household.totalValuation === 0 ? 0 : summary.totalValuation / household.totalValuation,
  };
  const trendSeries = selectOwnerHistory(snapshots, ownerFilter, fallbackShare);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // First run: nothing in the household yet — welcome + onboarding instead
  // of a grid of empty ₩0 cards.
  if (allAssets.length === 0) {
    return <DashboardOnboarding />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t("대시보드")}</h1>
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
          <TrendChart
            snapshots={trendSeries}
            color={ownerFilter === "ALL" ? undefined : ownerColor(ownerFilter)}
          />
        </div>
        <OwnerBreakdown allocation={ownerAllocation} />
        <div className="lg:col-span-2">
          <AssetsPreview assets={assets} />
        </div>
      </div>
    </div>
  );
}
