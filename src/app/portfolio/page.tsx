"use client";

import { useEffect, useState } from "react";
import AssetTable from "@/components/portfolio/AssetTable";
import TopHoldingsChart from "@/components/portfolio/TopHoldingsChart";
import CurrencyToggle from "@/components/common/CurrencyToggle";
import OwnerFilterToggle from "@/components/common/OwnerFilterToggle";
import { usePortfolio } from "@/lib/portfolio-context";
import { useDisplayCurrency } from "@/lib/currency-context";
import { formatMoney } from "@/lib/format";
import { getAssetMetrics } from "@/lib/services/portfolio-service";
import { mergeHoldings, toDisplayHoldings } from "@/lib/services/merge-holdings";
import {
  getPortfolioCategory,
  PORTFOLIO_CATEGORIES,
  PORTFOLIO_CATEGORY_COLOR,
  PORTFOLIO_CATEGORY_LABEL,
} from "@/lib/models/portfolio-category";

const MERGE_STORAGE_KEY = "nexus:merge-holdings";

export default function PortfolioPage() {
  const { assets, isLoading } = usePortfolio();
  const { displayCurrency, usdKrw } = useDisplayCurrency();
  const [mergeSame, setMergeSame] = useState(false);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (window.localStorage.getItem(MERGE_STORAGE_KEY) === "1") setMergeSame(true);
    } catch {
      // ignore storage failures
    }
  }, []);

  function toggleMerge() {
    setMergeSame((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(MERGE_STORAGE_KEY, next ? "1" : "0");
      } catch {
        // ignore storage failures
      }
      return next;
    });
  }

  if (isLoading) {
    return <p className="py-24 text-center text-sm text-gray-400 dark:text-gray-500">불러오는 중...</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">포트폴리오</h1>
          <p className="text-sm font-medium text-gray-400 dark:text-gray-500">
            보유 자산 {assets.length}개
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={toggleMerge}
            aria-pressed={mergeSame}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
              mergeSame
                ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                : "bg-gray-50 text-gray-400 hover:text-gray-600 dark:bg-white/5 dark:text-gray-500 dark:hover:text-gray-300"
            }`}
          >
            같은 종목 합산
          </button>
          <OwnerFilterToggle />
          <CurrencyToggle />
        </div>
      </div>

      {mergeSame && (
        <p className="-mt-4 px-1 text-[11px] text-gray-400 dark:text-gray-500">
          같은 티커의 주식을 하나로 합쳐 표시합니다 (수량 합산, 평단가는 가중평균). 합산 행은
          수정/삭제할 수 없으며, 개별 수정은 합산을 해제한 뒤 진행하세요.
        </p>
      )}

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

          const holdings = mergeSame
            ? mergeHoldings(groupAssets)
            : toDisplayHoldings(groupAssets);
          const displayAssets = holdings.map((holding) => holding.asset);

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
                  {PORTFOLIO_CATEGORY_LABEL[category]} {holdings.length}
                </h2>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {formatMoney(groupTotal, displayCurrency, usdKrw)}
                </p>
              </div>
              <TopHoldingsChart
                assets={displayAssets}
                color={PORTFOLIO_CATEGORY_COLOR[category]}
              />
              <AssetTable holdings={holdings} />
            </section>
          );
        })
      )}
    </div>
  );
}
