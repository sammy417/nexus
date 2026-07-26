"use client";

import StatTiles from "@/components/analytics/StatTiles";
import MonthlyReturnsChart from "@/components/analytics/MonthlyReturnsChart";
import CategoryProfitChart from "@/components/analytics/CategoryProfitChart";
import GrowthChart from "@/components/analytics/GrowthChart";
import OwnerComparison from "@/components/analytics/OwnerComparison";
import CurrencyToggle from "@/components/common/CurrencyToggle";
import OwnerFilterToggle from "@/components/common/OwnerFilterToggle";
import AnalyticsSkeleton from "@/components/skeletons/AnalyticsSkeleton";
import EmptyState from "@/components/common/EmptyState";
import { BarChart3, Plus } from "lucide-react";
import { usePortfolio } from "@/lib/portfolio-context";
import { useAssetModal } from "@/lib/asset-modal-context";
import { useT } from "@/lib/i18n/locale-context";
import { useDisplayCurrency } from "@/lib/currency-context";
import { useOwnerFilter } from "@/lib/owner-filter-context";
import { getPortfolioSummary } from "@/lib/services/portfolio-service";
import { selectOwnerHistory, usesFallback } from "@/lib/services/owner-history";
import {
  getCategoryProfits,
  getMaxDrawdown,
  getMonthlyReturns,
  getWindowReturn,
} from "@/lib/services/analytics-service";
import { useSettings } from "@/lib/settings-context";

export default function AnalyticsPage() {
  const { assets, allAssets, snapshots, summary, isLoading } = usePortfolio();
  const { usdKrw } = useDisplayCurrency();
  const { ownerFilter } = useOwnerFilter();
  const { ownerName, ownerColor } = useSettings();
  const { openAddModal } = useAssetModal();
  const t = useT();

  if (isLoading) {
    return <AnalyticsSkeleton />;
  }

  // No assets in the household yet — analytics has nothing to compute.
  if (allAssets.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t("분석")}</h1>
        <EmptyState
          icon={BarChart3}
          title={t("분석할 자산이 아직 없어요")}
          description={t(
            "자산을 추가하면 기간 수익률·최대 낙폭·카테고리별 손익과 성장 추이를 자동으로 계산해 보여드려요."
          )}
          action={{
            label: t("첫 자산 추가하기"),
            onClick: openAddModal,
            icon: <Plus size={16} strokeWidth={2.5} />,
          }}
        />
      </div>
    );
  }

  // Owner-scoped history (real byOwner, else scaled by current share).
  const household = getPortfolioSummary(allAssets, usdKrw);
  const series = selectOwnerHistory(snapshots, ownerFilter, {
    principal: household.totalPrincipal === 0 ? 0 : summary.totalPrincipal / household.totalPrincipal,
    valuation: household.totalValuation === 0 ? 0 : summary.totalValuation / household.totalValuation,
  });

  const monthlyReturns = getMonthlyReturns(series);
  const categoryProfits = getCategoryProfits(assets, usdKrw);
  const scopeLabel = ownerFilter === "ALL" ? t("전체") : ownerName(ownerFilter);
  const approximated = usesFallback(snapshots, ownerFilter);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t("분석")}</h1>
        <div className="flex items-center gap-3">
          <OwnerFilterToggle />
          <CurrencyToggle />
        </div>
      </div>

      {ownerFilter !== "ALL" && (
        <p className="-mt-2 px-1 text-[11px] text-gray-400 dark:text-gray-500">
          <span className="font-semibold" style={{ color: ownerColor(ownerFilter) }}>
            {scopeLabel}
          </span>{" "}
          {t("기준으로 집계했습니다.")}
          {approximated && t(" 소유자별 기록이 없는 과거 구간은 현재 비중으로 추정한 값입니다.")}
        </p>
      )}

      <StatTiles
        tiles={[
          {
            label: t("{scope} 수익률 (원금 대비)", { scope: scopeLabel }),
            rate: summary.totalPrincipal === 0 ? null : summary.totalProfitRate,
            amountKrw: summary.totalProfit,
          },
          { label: t("최근 1개월"), rate: getWindowReturn(series, 30) },
          { label: t("최근 3개월"), rate: getWindowReturn(series, 90) },
          { label: t("최대 낙폭 (전체 기간)"), rate: getMaxDrawdown(series) },
        ]}
      />

      {ownerFilter === "ALL" && <OwnerComparison assets={allAssets} />}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <MonthlyReturnsChart returns={monthlyReturns} />
        <CategoryProfitChart profits={categoryProfits} />
      </div>

      <GrowthChart
        snapshots={series}
        color={ownerFilter === "ALL" ? undefined : ownerColor(ownerFilter)}
      />
    </div>
  );
}
