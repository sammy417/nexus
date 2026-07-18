"use client";

import { CategoryProfit } from "@/lib/services/analytics-service";
import { formatPercent, formatSignedMoney } from "@/lib/format";
import { PORTFOLIO_CATEGORY_LABEL } from "@/lib/models/portfolio-category";
import { useDisplayCurrency } from "@/lib/currency-context";

/**
 * Current P&L per category as diverging horizontal bars from a shared
 * zero baseline — profit grows right (rise red), loss grows left (fall
 * blue). Every bar is directly labeled with the signed amount and rate.
 */
export default function CategoryProfitChart({ profits }: { profits: CategoryProfit[] }) {
  const { displayCurrency, usdKrw } = useDisplayCurrency();

  const maxAbs = Math.max(...profits.map((entry) => Math.abs(entry.profit)), 1);

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-card-dark">
      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">카테고리별 평가 손익</p>
      <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
        현재 보유 자산의 원금 대비 손익 (실현 손익 미포함)
      </p>

      <ul className="mt-4 flex flex-col gap-3">
        {profits.map((entry) => {
          const positive = entry.profit >= 0;
          const widthRatio = (Math.abs(entry.profit) / maxAbs) * 100;

          return (
            <li key={entry.category} className="grid grid-cols-[4.5rem_1fr] items-center gap-3">
              <span className="truncate text-xs font-medium text-gray-700 dark:text-gray-300">
                {PORTFOLIO_CATEGORY_LABEL[entry.category]}
              </span>
              <div className="flex items-center gap-2">
                <div className="relative h-3 flex-1">
                  {/* zero baseline at the center of the track */}
                  <div className="absolute inset-y-0 left-1/2 w-px bg-gray-200 dark:bg-white/15" />
                  <div
                    className={`absolute inset-y-0 ${
                      positive
                        ? "left-1/2 rounded-r-full bg-rise"
                        : "right-1/2 rounded-l-full bg-fall"
                    }`}
                    style={{ width: `${Math.max(widthRatio / 2, entry.profit === 0 ? 0 : 1)}%` }}
                  />
                </div>
                <span className="w-40 shrink-0 text-right text-xs [font-variant-numeric:tabular-nums]">
                  <span className={`font-semibold ${positive ? "text-rise" : "text-fall"}`}>
                    {formatSignedMoney(entry.profit, displayCurrency, usdKrw)}
                  </span>
                  <span className="ml-1 text-gray-400 dark:text-gray-500">
                    ({formatPercent(entry.profitRate)})
                  </span>
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
