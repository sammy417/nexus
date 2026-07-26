"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { SortableHeader, sortRows, useSort } from "@/components/common/SortableHeader";
import { formatPercent } from "@/lib/format";
import { useDisplayCurrency } from "@/lib/currency-context";
import { useT } from "@/lib/i18n/locale-context";
import { getStockSectorLabel, sectorColor } from "@/lib/models/stock-sector";
import { hexWithAlpha } from "@/lib/models/asset-owner";
import { StockAsset } from "@/lib/models/asset";
import type { Contribution } from "@/lib/services/stock-analysis-service";

/** Rows shown before the "더보기" toggle. */
const DEFAULT_VISIBLE = 5;

type SortKey = "name" | "sector" | "weight" | "valuation" | "profit" | "share";

/** Per-stock table: sector, region, weight, valuation, P&L, contribution. */
export default function StockTable({
  rows,
  onSelect,
}: {
  rows: Contribution[];
  onSelect: (asset: StockAsset) => void;
}) {
  const { money, signedMoney } = useDisplayCurrency();
  const t = useT();
  const { sort, toggle: toggleSort } = useSort<SortKey>(["name", "sector"]);
  const [expanded, setExpanded] = useState(false);

  // Default = biggest positions first, so the collapsed view is the real
  // Top 5. The 섹터 column sorts on the base sector + free-text sub-sector
  // combined, so "기술 (반도체)" and "기술 (AI SW)" cluster together.
  const sorted = useMemo(
    () =>
      sortRows(
        rows,
        sort,
        (row, key) => {
          if (key === "name") return row.holding.asset.name;
          if (key === "sector") return getStockSectorLabel(row.holding.asset);
          if (key === "share") return row.share;
          if (key === "valuation") return row.holding.valuation;
          if (key === "profit") return row.holding.profit;
          return row.holding.weight;
        },
        { key: "weight", direction: "desc" }
      ),
    [rows, sort]
  );
  const hiddenCount = sorted.length - DEFAULT_VISIBLE;
  const isCollapsible = hiddenCount > 0;
  const visible = isCollapsible && !expanded ? sorted.slice(0, DEFAULT_VISIBLE) : sorted;

  return (
    <div className="overflow-x-auto rounded-2xl bg-white shadow-sm dark:bg-card-dark">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b border-border text-left dark:border-border-dark">
            <SortableHeader label="종목" sortKey="name" align="left" sort={sort} onToggle={toggleSort} />
            <SortableHeader label="섹터" sortKey="sector" align="left" sort={sort} onToggle={toggleSort} />
            <SortableHeader label="비중" sortKey="weight" sort={sort} onToggle={toggleSort} />
            <SortableHeader label="평가 금액" sortKey="valuation" sort={sort} onToggle={toggleSort} />
            <SortableHeader label="평가 손익" sortKey="profit" sort={sort} onToggle={toggleSort} />
            <SortableHeader label="손익 기여" sortKey="share" sort={sort} onToggle={toggleSort} />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 dark:divide-white/5">
          {visible.map(({ holding, share }) => {
            const isProfit = holding.profit >= 0;
            const color = sectorColor(holding.sector);
            return (
              <tr
                key={holding.asset.id}
                onClick={() => onSelect(holding.asset)}
                className="group cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-white/5"
              >
                <td className="px-4 py-3.5">
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {holding.asset.name}
                    {holding.asset.currency === "USD" && (
                      <span className="ml-1.5 rounded bg-gray-100 px-1 py-0.5 text-[10px] font-semibold text-gray-500 dark:bg-white/10 dark:text-gray-400">
                        USD
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                    {[holding.asset.market, holding.asset.ticker].filter(Boolean).join(" · ") ||
                      (holding.region === "KR" ? t("국내") : t("해외"))}
                  </p>
                </td>
                <td className="whitespace-nowrap px-4 py-3.5">
                  <span
                    className="rounded px-1.5 py-0.5 text-[11px] font-semibold"
                    style={{ color, backgroundColor: hexWithAlpha(color, 0.12) }}
                  >
                    {getStockSectorLabel(holding.asset, t)}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-right text-gray-700 [font-variant-numeric:tabular-nums] dark:text-gray-300">
                  {holding.weight.toFixed(1)}%
                </td>
                <td className="px-4 py-3.5 text-right font-medium text-gray-900 dark:text-gray-100">
                  {money(holding.valuation)}
                </td>
                <td className="px-4 py-3.5 text-right">
                  <span className={`font-medium ${isProfit ? "text-rise" : "text-fall"}`}>
                    {signedMoney(holding.profit)} ({formatPercent(holding.profitRate)})
                  </span>
                </td>
                <td
                  className={`px-4 py-3.5 text-right [font-variant-numeric:tabular-nums] ${
                    share >= 0 ? "text-rise" : "text-fall"
                  }`}
                >
                  {share > 0 ? "+" : ""}
                  {share.toFixed(1)}%
                </td>
              </tr>
            );
          })}
        </tbody>
        {isCollapsible && (
          <tfoot>
            <tr>
              <td colSpan={6} className="border-t border-border p-0 dark:border-border-dark">
                <button
                  type="button"
                  onClick={() => setExpanded((prev) => !prev)}
                  className="flex w-full items-center justify-center gap-1 py-3 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200"
                >
                  {expanded ? t("접기") : t("전체보기 ({count}개 더)", { count: hiddenCount })}
                  <ChevronDown
                    size={14}
                    className={`transition-transform ${expanded ? "rotate-180" : ""}`}
                  />
                </button>
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
