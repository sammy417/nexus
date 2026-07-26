"use client";

import { useMemo } from "react";
import { SortableHeader, sortRows, useSort } from "@/components/common/SortableHeader";
import { StockAsset } from "@/lib/models/asset";
import { formatPercent } from "@/lib/format";
import { hexWithAlpha } from "@/lib/models/asset-owner";
import { useStockHistory } from "@/lib/hooks/use-stock-history";
import { useT } from "@/lib/i18n/locale-context";
import { Skeleton } from "@/components/common/Skeleton";
import {
  getCorrelationMatrix,
  getRiskRows,
  type RiskRow,
} from "@/lib/services/stock-risk-service";

const RISE = "#F04452";
const FALL = "#3182F6";
const numCellClass =
  "px-4 py-3.5 text-right [font-variant-numeric:tabular-nums]";

type SortKey = "name" | "volatility" | "return1y" | "maxDrawdown" | "position";

function toneClass(value: number): string {
  return value >= 0 ? "text-rise" : "text-fall";
}

function label(asset: StockAsset): string {
  return asset.ticker?.trim().toUpperCase() || asset.name;
}

/** Volatility/return/drawdown table + return-correlation heatmap. */
export default function StockRiskSection({ stocks }: { stocks: StockAsset[] }) {
  const { history, isLoading } = useStockHistory(stocks);
  const t = useT();
  const { sort, toggle: toggleSort } = useSort<SortKey>(["name"]);

  const riskRows = getRiskRows(stocks, history);
  const rows = useMemo(
    () =>
      sortRows(riskRows, sort, (row, key) =>
        key === "name" ? row.asset.name : row[key]
      ),
    [riskRows, sort]
  );
  const correlation = getCorrelationMatrix(stocks, history);

  if (isLoading) {
    return (
      <section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-card-dark">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-1 h-3 w-56" />
        <div className="mt-4 flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-56" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (rows.length === 0) {
    return (
      <section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-card-dark">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t("리스크 분석")}</p>
        <p className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">
          {t("시세 이력을 불러오지 못했습니다 (티커 필요).")}
        </p>
      </section>
    );
  }

  return (
    <>
      <section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-card-dark">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t("리스크 분석")}</p>
        <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
          {t("최근 1년 일간 시세 기준 · 변동성은 연율화")}
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-border text-left dark:border-border-dark">
                <SortableHeader label="종목" sortKey="name" align="left" sort={sort} onToggle={toggleSort} />
                <SortableHeader label="변동성 (연율)" sortKey="volatility" sort={sort} onToggle={toggleSort} />
                <SortableHeader label="1년 수익률" sortKey="return1y" sort={sort} onToggle={toggleSort} />
                <SortableHeader label="최대 낙폭" sortKey="maxDrawdown" sort={sort} onToggle={toggleSort} />
                <SortableHeader label="52주 위치" sortKey="position" sort={sort} onToggle={toggleSort} />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-white/5">
              {rows.map((row: RiskRow) => (
                <tr key={row.asset.id}>
                  <td className="px-4 py-3.5">
                    <p className="font-medium text-gray-900 dark:text-gray-100">{row.asset.name}</p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500">{row.asset.ticker}</p>
                  </td>
                  <td className={`${numCellClass} text-gray-700 dark:text-gray-300`}>
                    {row.volatility.toFixed(1)}%
                  </td>
                  <td className={`${numCellClass} font-medium ${toneClass(row.return1y)}`}>
                    {formatPercent(row.return1y)}
                  </td>
                  <td className={`${numCellClass} text-fall`}>{row.maxDrawdown.toFixed(1)}%</td>
                  <td className={`${numCellClass} text-gray-700 dark:text-gray-300`}>
                    {row.position.toFixed(0)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {correlation && (
        <section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-card-dark">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t("상관관계")}</p>
          <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
            {t("일간 수익률 상관계수 · 빨강=동조, 파랑=역행 (공통 {days}일)", {
              days: correlation.days,
            })}
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="text-xs [font-variant-numeric:tabular-nums]">
              <thead>
                <tr>
                  <th className="p-1" />
                  {correlation.assets.map((a) => (
                    <th
                      key={a.id}
                      className="p-1 text-center font-medium text-gray-400 dark:text-gray-500"
                    >
                      {label(a)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {correlation.assets.map((rowAsset, i) => (
                  <tr key={rowAsset.id}>
                    <th className="whitespace-nowrap p-1 pr-2 text-right font-medium text-gray-500 dark:text-gray-400">
                      {label(rowAsset)}
                    </th>
                    {correlation.matrix[i].map((corr, j) => (
                      <td
                        key={j}
                        title={`${label(rowAsset)} · ${label(correlation.assets[j])}: ${corr.toFixed(2)}`}
                        className="h-10 min-w-[3rem] rounded text-center font-semibold text-gray-800 dark:text-gray-100"
                        style={{
                          backgroundColor: hexWithAlpha(
                            corr >= 0 ? RISE : FALL,
                            Math.min(Math.abs(corr), 0.85)
                          ),
                        }}
                      >
                        {corr.toFixed(2)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
