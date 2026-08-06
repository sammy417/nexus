"use client";

import { Asset } from "@/lib/models/asset";
import { getAssetCategoryLabel } from "@/lib/models/portfolio-category";
import { getAssetMetrics } from "@/lib/services/portfolio-service";
import { useDisplayCurrency } from "@/lib/currency-context";
import { useT } from "@/lib/i18n/locale-context";

/**
 * The assets no goal has claimed. Surfacing this is the point of the whole
 * page — "this 30,000,000 isn't earmarked for anything" is exactly what a
 * plain total hides.
 */
export default function UnassignedAssetsCard({ assets, totalKrw }: { assets: Asset[]; totalKrw: number }) {
  const { usdKrw, money } = useDisplayCurrency();
  const t = useT();

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-card-dark">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t("미배정 자산")}</p>
        <span className="text-sm font-bold text-gray-900 [font-variant-numeric:tabular-nums] dark:text-gray-100">
          {money(totalKrw)}
        </span>
      </div>

      {assets.length === 0 ? (
        <p className="mt-4 text-center text-xs text-gray-400 dark:text-gray-500">
          {t("모든 자산이 목표에 배정되었습니다.")}
        </p>
      ) : (
        <>
          <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
            {t("어느 목표에도 배정되지 않은 자산입니다. 각 목표 카드의 '자산 배정'에서 연결하세요.")}
          </p>
          <div className="mt-3 divide-y divide-gray-50 dark:divide-white/5">
            {assets.map((asset) => (
              <div key={asset.id} className="flex items-center justify-between py-2">
                <span className="min-w-0">
                  <span className="block truncate text-xs font-medium text-gray-800 dark:text-gray-200">{asset.name}</span>
                  <span className="block truncate text-[10px] text-gray-400 dark:text-gray-500">
                    {getAssetCategoryLabel(asset)}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-gray-500 [font-variant-numeric:tabular-nums] dark:text-gray-400">
                  {money(getAssetMetrics(asset, usdKrw).valuation)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
