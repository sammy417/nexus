"use client";

import StatTiles from "@/components/analytics/StatTiles";
import MonthlyReturnsChart from "@/components/analytics/MonthlyReturnsChart";
import CategoryProfitChart from "@/components/analytics/CategoryProfitChart";
import GrowthChart from "@/components/analytics/GrowthChart";
import CurrencyToggle from "@/components/common/CurrencyToggle";
import OwnerFilterToggle from "@/components/common/OwnerFilterToggle";
import { usePortfolio } from "@/lib/portfolio-context";
import { useDisplayCurrency } from "@/lib/currency-context";
import { useOwnerFilter } from "@/lib/owner-filter-context";
import {
  getCategoryProfits,
  getMaxDrawdown,
  getMonthlyReturns,
  getWindowReturn,
} from "@/lib/services/analytics-service";

export default function AnalyticsPage() {
  const { assets, snapshots, summary, isLoading } = usePortfolio();
  const { usdKrw } = useDisplayCurrency();
  const { ownerFilter } = useOwnerFilter();

  if (isLoading) {
    return <p className="py-24 text-center text-sm text-gray-400 dark:text-gray-500">불러오는 중...</p>;
  }

  const monthlyReturns = getMonthlyReturns(snapshots);
  const categoryProfits = getCategoryProfits(assets, usdKrw);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">분석</h1>
        <div className="flex items-center gap-3">
          <OwnerFilterToggle />
          <CurrencyToggle />
        </div>
      </div>

      {ownerFilter !== "ALL" && (
        <p className="-mt-2 px-1 text-[11px] text-gray-400 dark:text-gray-500">
          카테고리별 손익과 전체 수익률은 선택한 소유자 기준, 기간 수익률·낙폭·성장 추이는
          전체(합산) 히스토리 기준입니다.
        </p>
      )}

      <StatTiles
        tiles={[
          {
            label: "전체 수익률 (원금 대비)",
            rate: summary.totalPrincipal === 0 ? null : summary.totalProfitRate,
            amountKrw: summary.totalProfit,
          },
          { label: "최근 1개월", rate: getWindowReturn(snapshots, 30) },
          { label: "최근 3개월", rate: getWindowReturn(snapshots, 90) },
          { label: "최대 낙폭 (전체 기간)", rate: getMaxDrawdown(snapshots) },
        ]}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <MonthlyReturnsChart returns={monthlyReturns} />
        <CategoryProfitChart profits={categoryProfits} />
      </div>

      <GrowthChart snapshots={snapshots} />
    </div>
  );
}
