"use client";

import AssetTable from "@/components/portfolio/AssetTable";
import CurrencyToggle from "@/components/common/CurrencyToggle";
import { usePortfolio } from "@/lib/portfolio-context";
import { ASSET_TYPE_LABEL, ASSET_TYPES } from "@/lib/models/asset-types";

export default function PortfolioPage() {
  const { assets, isLoading } = usePortfolio();

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
        ASSET_TYPES.map((type) => {
          const groupAssets = assets.filter((asset) => asset.type === type);
          if (groupAssets.length === 0) return null;

          return (
            <section key={type} className="flex flex-col gap-3">
              <h2 className="px-1 text-sm font-semibold text-gray-500 dark:text-gray-400">
                {ASSET_TYPE_LABEL[type]} {groupAssets.length}
              </h2>
              <AssetTable assets={groupAssets} />
            </section>
          );
        })
      )}
    </div>
  );
}
