"use client";

import { StockAsset } from "@/lib/models/asset";
import { formatMarketCap } from "@/lib/models/stock-valuation";
import { useStockValuations } from "@/lib/hooks/use-stock-valuations";
import { useT } from "@/lib/i18n/locale-context";
import { Skeleton } from "@/components/common/Skeleton";

const headerCellClass = "px-4 py-3 text-xs font-medium text-gray-400 dark:text-gray-500";
const numCellClass =
  "px-4 py-3.5 text-right text-gray-700 [font-variant-numeric:tabular-nums] dark:text-gray-300";

function num(value: number | null, digits: number, suffix = ""): string {
  return value === null ? "-" : `${value.toFixed(digits)}${suffix}`;
}

/** 52-week range position bar (0 = low, 100 = high). */
function RangeBar({ position }: { position: number }) {
  return (
    <div className="ml-auto flex w-28 items-center gap-2">
      <div className="relative h-1.5 flex-1 rounded-full bg-gray-100 dark:bg-white/10">
        <div
          className="absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-fall"
          style={{ left: `calc(${Math.max(0, Math.min(100, position))}% - 5px)` }}
        />
      </div>
      <span className="w-9 shrink-0 text-right text-[11px] text-gray-500 [font-variant-numeric:tabular-nums] dark:text-gray-400">
        {position.toFixed(0)}%
      </span>
    </div>
  );
}

/** PER/PBR/market-cap/yield/52-week comparison across the held stocks. */
export default function StockValuationTable({ stocks }: { stocks: StockAsset[] }) {
  const { valuations, isLoading } = useStockValuations(stocks);
  const t = useT();

  const withTicker = stocks.filter((s) => s.ticker?.trim());
  const hasAny = withTicker.some((s) => valuations[s.ticker!.trim().toUpperCase()]);

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-card-dark">
      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t("밸류에이션 비교")}</p>
      <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
        {t("외부 시세 제공사 기준 · PER·PBR·시가총액·배당수익률·52주 위치")}
      </p>

      {isLoading ? (
        <div className="mt-4 flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
          ))}
        </div>
      ) : withTicker.length === 0 ? (
        <p className="py-10 text-center text-sm text-gray-400 dark:text-gray-500">
          {t("티커가 입력된 주식이 없어 조회할 수 없습니다.")}
        </p>
      ) : !hasAny ? (
        <p className="py-10 text-center text-sm text-gray-400 dark:text-gray-500">
          {t("밸류에이션 데이터를 불러오지 못했습니다.")}
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-left dark:border-border-dark">
                <th className={headerCellClass}>{t("종목")}</th>
                <th className={`${headerCellClass} text-right`}>PER</th>
                <th className={`${headerCellClass} text-right`}>PBR</th>
                <th className={`${headerCellClass} text-right`}>{t("시가총액")}</th>
                <th className={`${headerCellClass} text-right`}>{t("배당수익률")}</th>
                <th className={`${headerCellClass} text-right`}>{t("52주 위치")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-white/5">
              {withTicker.map((asset) => {
                const v = valuations[asset.ticker!.trim().toUpperCase()];
                const position =
                  v && v.price !== null && v.fiftyTwoWeekHigh !== null && v.fiftyTwoWeekLow !== null
                    ? v.fiftyTwoWeekHigh === v.fiftyTwoWeekLow
                      ? 100
                      : ((v.price - v.fiftyTwoWeekLow) / (v.fiftyTwoWeekHigh - v.fiftyTwoWeekLow)) * 100
                    : null;
                return (
                  <tr key={asset.id}>
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-gray-900 dark:text-gray-100">{asset.name}</p>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500">{asset.ticker}</p>
                    </td>
                    <td className={numCellClass}>{num(v?.per ?? null, 1)}</td>
                    <td className={numCellClass}>{num(v?.pbr ?? null, 2)}</td>
                    <td className={numCellClass}>
                      {v?.marketCap != null ? formatMarketCap(v.marketCap, v.currency) : "-"}
                    </td>
                    <td className={numCellClass}>{num(v?.dividendYield ?? null, 2, "%")}</td>
                    <td className="px-4 py-3.5">
                      {position === null ? (
                        <span className="block text-right text-gray-400 dark:text-gray-500">-</span>
                      ) : (
                        <RangeBar position={position} />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
