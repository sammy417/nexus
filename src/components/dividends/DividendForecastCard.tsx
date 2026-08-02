"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { SortableHeader, sortRows, useSort } from "@/components/common/SortableHeader";
import type {
  DividendForecast,
  HoldingDividendForecast,
} from "@/lib/services/dividend-forecast-service";
import { DIVIDEND_TAX_RATE } from "@/lib/models/dividend";
import { Skeleton } from "@/components/common/Skeleton";
import AnimatedNumber from "@/components/common/AnimatedNumber";
import { hexWithAlpha } from "@/lib/models/asset-owner";
import { useDisplayCurrency } from "@/lib/currency-context";
import { useT } from "@/lib/i18n/locale-context";

/** Rows shown before the "더보기" toggle. */
const DEFAULT_VISIBLE = 5;
/** Accent for the portfolio dividend-yield pill. */
const YIELD_COLOR = "#1baf7a";

type SortKey = "name" | "perShare" | "annual" | "yield";

function formatPerShare(value: number, currency: string): string {
  if (currency === "USD") {
    return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `₩${Math.round(value).toLocaleString("ko-KR")}`;
}

function payers(holdings: HoldingDividendForecast[]): HoldingDividendForecast[] {
  return holdings.filter((h) => h.perShareTrailing12m > 0);
}

/** 보유 종목 배당 이력 기반 연간 예상 배당 + 배당수익률 (세전 추정). */
export default function DividendForecastCard({
  forecast,
  isLoading,
}: {
  forecast: DividendForecast | null;
  isLoading: boolean;
}) {
  const { money } = useDisplayCurrency();
  const t = useT();
  const { sort, toggle: toggleSort } = useSort<SortKey>(["name"]);
  const [expanded, setExpanded] = useState(false);

  // Default = biggest estimated payout first, so the collapsed view is the
  // real Top 5.
  const paying = useMemo(() => {
    const base = forecast ? payers(forecast.holdings) : [];
    return sortRows(
      base,
      sort,
      (h, key) => {
        if (key === "name") return h.name;
        if (key === "perShare") return h.perShareTrailing12m;
        if (key === "yield") return h.yieldPct;
        return h.annualEstimateKrw;
      },
      { key: "annual", direction: "desc" }
    );
  }, [forecast, sort]);
  const nonPaying = forecast ? forecast.holdings.length - paying.length : 0;
  const hiddenCount = paying.length - DEFAULT_VISIBLE;
  const isCollapsible = hiddenCount > 0;
  const visiblePaying = isCollapsible && !expanded ? paying.slice(0, DEFAULT_VISIBLE) : paying;
  // Totals derived from the (possibly owner-filtered) holdings passed in.
  const totalAnnualKrw = paying.reduce((sum, h) => sum + h.annualEstimateKrw, 0);
  const totalValuationKrw = paying.reduce((sum, h) => sum + h.valuationKrw, 0);
  const yieldPct = totalValuationKrw > 0 ? (totalAnnualKrw / totalValuationKrw) * 100 : null;
  const afterTaxKrw = totalAnnualKrw * (1 - DIVIDEND_TAX_RATE);

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-card-dark">
      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t("예상 연간 배당")}</p>
      <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
        {t("보유 종목의 최근 12개월 배당 이력 × 현재 보유 수량 · 세전 추정")}
      </p>

      {isLoading ? (
        <div className="mt-4">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="mt-2 h-3 w-48" />
          <div className="mt-5 flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>
      ) : !forecast || paying.length === 0 ? (
        <p className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">
          {t("배당 이력이 조회된 보유 종목이 없습니다.")}
        </p>
      ) : (
        <>
          <div className="mt-4 flex items-baseline gap-3">
            <p className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              <AnimatedNumber value={totalAnnualKrw} format={money} />
            </p>
            {yieldPct !== null && (
              <p
                className="rounded-full px-2.5 py-1 text-xs font-semibold"
                style={{ color: YIELD_COLOR, backgroundColor: hexWithAlpha(YIELD_COLOR, 0.12) }}
              >
                {t("배당수익률 {pct}", { pct: `${yieldPct.toFixed(2)}%` })}
              </p>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            {t("세후 약 {amount}", { amount: money(afterTaxKrw) })}
            <span className="ml-1">
              {t("(원천징수 {pct} 가정)", { pct: `${(DIVIDEND_TAX_RATE * 100).toFixed(1)}%` })}
            </span>
          </p>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[430px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-medium text-gray-400 dark:border-border-dark dark:text-gray-500">
                  <SortableHeader label="종목" sortKey="name" align="left" sort={sort} onToggle={toggleSort} className="!px-0 !py-2 !pr-3" />
                  <SortableHeader label="주당 배당 (12개월)" sortKey="perShare" sort={sort} onToggle={toggleSort} className="!px-0 !py-2 !pr-3" />
                  <SortableHeader label="예상 연간 수령액" sortKey="annual" sort={sort} onToggle={toggleSort} className="!px-0 !py-2 !pr-3" />
                  <SortableHeader label="시가 배당률" sortKey="yield" sort={sort} onToggle={toggleSort} className="!px-0 !py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                {visiblePaying.map((holding) => (
                  <tr key={holding.assetId}>
                    <td className="py-2.5 pr-3">
                      <p className="font-medium text-gray-900 dark:text-gray-100">{holding.name}</p>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500">
                        {holding.ticker} · {t("{n}주", { n: holding.quantity.toLocaleString("ko-KR") })}
                      </p>
                    </td>
                    <td className="py-2.5 pr-3 text-right text-gray-700 [font-variant-numeric:tabular-nums] dark:text-gray-300">
                      {formatPerShare(holding.perShareTrailing12m, holding.currency)}
                    </td>
                    <td className="py-2.5 pr-3 text-right font-medium text-gray-900 [font-variant-numeric:tabular-nums] dark:text-gray-100">
                      {money(holding.annualEstimateKrw)}
                    </td>
                    <td className="py-2.5 text-right text-gray-700 [font-variant-numeric:tabular-nums] dark:text-gray-300">
                      {holding.yieldPct === null ? "-" : `${holding.yieldPct.toFixed(2)}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {isCollapsible && (
            <button
              type="button"
              onClick={() => setExpanded((prev) => !prev)}
              className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg py-2 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200"
            >
              {expanded ? t("접기") : t("더보기 ({count}개 더)", { count: hiddenCount })}
              <ChevronDown
                size={14}
                className={`transition-transform ${expanded ? "rotate-180" : ""}`}
              />
            </button>
          )}

          {(nonPaying > 0 || forecast.failedTickers.length > 0) && (
            <p className="mt-3 text-[11px] leading-relaxed text-gray-400 dark:text-gray-500">
              {nonPaying > 0 && t("배당 이력이 없는 종목 {count}개는 제외했습니다. ", { count: nonPaying })}
              {forecast.failedTickers.length > 0 &&
                t("조회 실패: {tickers}", { tickers: forecast.failedTickers.join(", ") })}
            </p>
          )}
        </>
      )}
    </section>
  );
}
