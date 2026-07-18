"use client";

import StatTiles from "@/components/analytics/StatTiles";
import MonthlyReturnsChart from "@/components/analytics/MonthlyReturnsChart";
import CategoryProfitChart from "@/components/analytics/CategoryProfitChart";
import GrowthChart from "@/components/analytics/GrowthChart";
import CurrencyToggle from "@/components/common/CurrencyToggle";
import { usePortfolio } from "@/lib/portfolio-context";
import { useDisplayCurrency } from "@/lib/currency-context";
import {
  getCategoryProfits,
  getMaxDrawdown,
  getMonthlyReturns,
  getWindowReturn,
} from "@/lib/services/analytics-service";

export default function AnalyticsPage() {
  const { assets, snapshots, summary, isLoading } = usePortfolio();
  const { usdKrw } = useDisplayCurrency();

  if (isLoading) {
    return <p className="py-24 text-center text-sm text-gray-400 dark:text-gray-500">불러오는 중...</p>;
  }

  const monthlyReturns = getMonthlyReturns(snapshots);
  const categoryProfits = getCategoryProfits(assets, usdKrw);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">분석</h1>
        <CurrencyToggle />
      </div>

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
