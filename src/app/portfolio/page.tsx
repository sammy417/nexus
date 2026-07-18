"use client";

import AssetCard from "@/components/portfolio/AssetCard";
import { usePortfolio } from "@/lib/portfolio-context";
import { ASSET_TYPE_LABEL, ASSET_TYPES } from "@/lib/models/asset-types";

export default function PortfolioPage() {
  const { assets, isLoading } = usePortfolio();

  if (isLoading) {
    return <p className="py-24 text-center text-sm text-gray-400 dark:text-gray-500">불러오는 중...</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="px-1 text-sm font-medium text-gray-400 dark:text-gray-500">
        보유 자산 {assets.length}개
      </p>

      {assets.length === 0 ? (
        <p className="py-24 text-center text-sm text-gray-400 dark:text-gray-500">보유 자산이 없습니다.</p>
      ) : (
        ASSET_TYPES.map((type) => {
          const groupAssets = assets.filter((asset) => asset.type === type);
          if (groupAssets.length === 0) return null;

          return (
            <div key={type} className="flex flex-col gap-3">
              <p className="px-1 text-xs font-semibold text-gray-400 dark:text-gray-500">
                {ASSET_TYPE_LABEL[type]} {groupAssets.length}
              </p>
              {groupAssets.map((asset) => (
                <AssetCard key={asset.id} asset={asset} />
              ))}
            </div>
          );
        })
      )}
    </div>
  );
}
