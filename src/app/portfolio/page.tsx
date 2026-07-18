"use client";

import AssetTable from "@/components/portfolio/AssetTable";
import TopHoldingsChart from "@/components/portfolio/TopHoldingsChart";
import CurrencyToggle from "@/components/common/CurrencyToggle";
import { usePortfolio } from "@/lib/portfolio-context";
import { useDisplayCurrency } from "@/lib/currency-context";
import { formatMoney } from "@/lib/format";
import { getAssetMetrics } from "@/lib/services/portfolio-service";
import {
  getPortfolioCategory,
  PORTFOLIO_CATEGORIES,
  PORTFOLIO_CATEGORY_COLOR,
  PORTFOLIO_CATEGORY_LABEL,
} from "@/lib/models/portfolio-category";

export default function PortfolioPage() {
  const { assets, isLoading } = usePortfolio();
  const { displayCurrency, usdKrw } = useDisplayCurrency();

  if (isLoading) {
    return <p className="py-24 text-center text-sm text-gray-400 dark:text-gray-500">불러오는 중...</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">포트폴리오</h1>
          <p className="text-sm font-medium text-gray-400 dark:text-gray-500">
            보유 자산 {assets.length}개
          </p>
        </div>
        <CurrencyToggle />
      </div>

      {assets.length === 0 ? (
        <p className="py-24 text-center text-sm text-gray-400 dark:text-gray-500">
          보유 자산이 없습니다.
        </p>
      ) : (
        PORTFOLIO_CATEGORIES.map((category) => {
          const groupAssets = assets.filter(
            (asset) => getPortfolioCategory(asset) === category
          );
          if (groupAssets.length === 0) return null;

          const groupTotal = groupAssets.reduce(
            (sum, asset) => sum + getAssetMetrics(asset, usdKrw).valuation,
            0
          );

          return (
            <section key={category} className="flex flex-col gap-3">
              <div className="flex items-baseline justify-between px-1">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-gray-400">
                  <span
                    aria-hidden
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: PORTFOLIO_CATEGORY_COLOR[category] }}
                  />
                  {PORTFOLIO_CATEGORY_LABEL[category]} {groupAssets.length}
                </h2>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {formatMoney(groupTotal, displayCurrency, usdKrw)}
                </p>
              </div>
              <TopHoldingsChart
                assets={groupAssets}
                color={PORTFOLIO_CATEGORY_COLOR[category]}
              />
              <AssetTable assets={groupAssets} />
            </section>
          );
        })
      )}
    </div>
  );
}
