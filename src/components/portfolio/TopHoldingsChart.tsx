"use client";

import { getAssetMetrics } from "@/lib/services/portfolio-service";
import { formatMoney } from "@/lib/format";
import { Asset } from "@/lib/models/asset";
import { useDisplayCurrency } from "@/lib/currency-context";

/**
 * Top 5 holdings within one category as a horizontal bar list. Single
 * series (the category's own color), so no legend — each bar is directly
 * labeled with name, weight-in-category, and value; the table below
 * carries the full numbers.
 */
export default function TopHoldingsChart({
  assets,
  color,
}: {
  assets: Asset[];
  color: string;
}) {
  const { displayCurrency, usdKrw } = useDisplayCurrency();

  const withMetrics = assets.map((asset) => ({
    asset,
    valuation: getAssetMetrics(asset, usdKrw).valuation,
  }));
  const total = withMetrics.reduce((sum, item) => sum + item.valuation, 0);
  if (total <= 0 || withMetrics.length < 2) return null;

  const top = [...withMetrics].sort((a, b) => b.valuation - a.valuation).slice(0, 5);
  const maxRatio = (top[0].valuation / total) * 100;

  return (
    <div className="rounded-2xl bg-white px-5 py-4 shadow-sm dark:bg-card-dark">
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
        비중 Top {top.length}
      </p>
      <ul className="mt-3 flex flex-col gap-2.5">
        {top.map(({ asset, valuation }) => {
          const ratio = (valuation / total) * 100;
          return (
            <li key={asset.id} className="grid grid-cols-[9rem_1fr_auto] items-center gap-3">
              <span className="truncate text-xs font-medium text-gray-700 dark:text-gray-300">
                {asset.name}
              </span>
              <div className="h-2.5 rounded-full bg-gray-100 dark:bg-white/5">
                <div
                  className="h-full rounded-l-none rounded-r-full"
                  style={{
                    width: `${Math.max((ratio / maxRatio) * 100, 2)}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
              <span className="text-right text-xs [font-variant-numeric:tabular-nums]">
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {ratio.toFixed(1)}%
                </span>
                <span className="ml-1.5 text-gray-400 dark:text-gray-500">
                  {formatMoney(valuation, displayCurrency, usdKrw)}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
