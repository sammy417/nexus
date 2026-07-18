"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getAssetMetrics } from "@/lib/services/portfolio-service";
import { formatMoney, formatPercent } from "@/lib/format";
import { getAssetCategoryLabel } from "@/lib/models/portfolio-category";
import { Asset } from "@/lib/models/asset";
import { useDisplayCurrency } from "@/lib/currency-context";

export default function AssetsPreview({ assets }: { assets: Asset[] }) {
  const { displayCurrency, usdKrw } = useDisplayCurrency();
  const topAssets = [...assets]
    .sort((a, b) => getAssetMetrics(b, usdKrw).valuation - getAssetMetrics(a, usdKrw).valuation)
    .slice(0, 5);

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-card-dark">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">보유 자산</p>
        <Link
          href="/portfolio"
          className="flex items-center gap-0.5 text-xs font-medium text-gray-400 dark:text-gray-500"
        >
          전체보기
          <ChevronRight size={14} />
        </Link>
      </div>

      {topAssets.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">
          보유 자산이 없습니다.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-gray-50 dark:divide-white/5">
          {topAssets.map((asset) => {
            const { valuation, profitRate } = getAssetMetrics(asset, usdKrw);
            const isProfit = profitRate >= 0;

            return (
              <li key={asset.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{asset.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {getAssetCategoryLabel(asset)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {formatMoney(valuation, displayCurrency, usdKrw)}
                  </p>
                  {asset.type !== "CASH" && (
                    <p className={`text-xs font-medium ${isProfit ? "text-rise" : "text-fall"}`}>
                      {formatPercent(profitRate)}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
