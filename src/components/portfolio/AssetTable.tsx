"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown, Pencil, Trash2 } from "lucide-react";
import { getAssetMetrics } from "@/lib/services/portfolio-service";
import { useAssetModal } from "@/lib/asset-modal-context";
import { usePortfolio } from "@/lib/portfolio-context";
import { useDisplayCurrency } from "@/lib/currency-context";
import { formatMoney, formatPercent, formatSignedMoney } from "@/lib/format";
import { getAssetCategoryLabel } from "@/lib/models/portfolio-category";
import { Asset } from "@/lib/models/asset";

const headerCellClass =
  "px-4 py-3 text-xs font-medium text-gray-400 dark:text-gray-500";

type SortKey = "name" | "principal" | "valuation" | "weight" | "profit";
type SortDirection = "asc" | "desc";
interface SortState {
  key: SortKey;
  direction: SortDirection;
}

function SortableHeader({
  label,
  sortKey,
  sort,
  onToggle,
  align = "right",
}: {
  label: string;
  sortKey: SortKey;
  sort: SortState | null;
  onToggle: (key: SortKey) => void;
  align?: "left" | "right";
}) {
  const active = sort?.key === sortKey;
  return (
    <th className={`${headerCellClass} ${align === "right" ? "text-right" : ""}`}>
      <button
        type="button"
        onClick={() => onToggle(sortKey)}
        aria-label={`${label} 기준 정렬`}
        className={`group/sort inline-flex items-center gap-0.5 transition-colors hover:text-gray-600 dark:hover:text-gray-300 ${
          active ? "text-gray-700 dark:text-gray-200" : ""
        }`}
      >
        {label}
        {active ? (
          sort!.direction === "desc" ? (
            <ArrowDown size={12} />
          ) : (
            <ArrowUp size={12} />
          )
        ) : (
          <ChevronsUpDown size={12} className="opacity-0 group-hover/sort:opacity-60" />
        )}
      </button>
    </th>
  );
}

function subLine(asset: Asset): string | null {
  if (asset.type === "STOCK") {
    const parts = [asset.market, asset.ticker].filter(Boolean);
    return parts.length > 0 ? parts.join(" · ") : null;
  }
  if (asset.type === "BOND") {
    const parts = [
      asset.couponRate !== undefined ? `표면 ${asset.couponRate}%` : null,
      asset.maturityDate ? `만기 ${asset.maturityDate}` : null,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(" · ") : null;
  }
  if (asset.type === "PENSION") {
    return asset.accountType ?? null;
  }
  return null;
}

export default function AssetTable({ assets }: { assets: Asset[] }) {
  const { openEditModal, showToast } = useAssetModal();
  const { deleteAsset } = usePortfolio();
  const { displayCurrency, usdKrw } = useDisplayCurrency();
  const [sort, setSort] = useState<SortState | null>(null);

  async function handleDelete(asset: Asset) {
    const confirmed = window.confirm(`${asset.name} 자산을 삭제할까요?`);
    if (!confirmed) return;
    try {
      await deleteAsset(asset.id);
      showToast(`${asset.name} 자산이 삭제되었습니다.`);
    } catch {
      showToast("삭제에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    }
  }

  const groupTotal = assets.reduce(
    (sum, asset) => sum + getAssetMetrics(asset, usdKrw).valuation,
    0
  );

  const sortedAssets = useMemo(() => {
    if (!sort) return assets;
    const sortValue = (asset: Asset): number | string => {
      if (sort.key === "name") return asset.name;
      const { principal, valuation, profit } = getAssetMetrics(asset, usdKrw);
      // 비중 is valuation / group total — same ordering as valuation.
      if (sort.key === "principal") return principal;
      if (sort.key === "profit") return profit;
      return valuation;
    };
    return [...assets].sort((a, b) => {
      const va = sortValue(a);
      const vb = sortValue(b);
      const compared =
        typeof va === "string" && typeof vb === "string"
          ? va.localeCompare(vb, "ko")
          : (va as number) - (vb as number);
      return sort.direction === "asc" ? compared : -compared;
    });
  }, [assets, sort, usdKrw]);

  function toggleSort(key: SortKey) {
    setSort((prev) => {
      if (!prev || prev.key !== key) {
        // Numeric columns start with the largest first; names start A→Z.
        return { key, direction: key === "name" ? "asc" : "desc" };
      }
      return { key, direction: prev.direction === "desc" ? "asc" : "desc" };
    });
  }

  return (
    <div className="overflow-x-auto rounded-2xl bg-white shadow-sm dark:bg-card-dark">
      <table className="w-full min-w-[740px] text-sm">
        <thead>
          <tr className="border-b border-border text-left dark:border-border-dark">
            <SortableHeader label="자산" sortKey="name" align="left" sort={sort} onToggle={toggleSort} />
            <th className={headerCellClass}>종류</th>
            <th className={`${headerCellClass} text-right`}>보유 수량</th>
            <SortableHeader label="투자 원금" sortKey="principal" sort={sort} onToggle={toggleSort} />
            <SortableHeader label="평가 금액" sortKey="valuation" sort={sort} onToggle={toggleSort} />
            <SortableHeader label="비중" sortKey="weight" sort={sort} onToggle={toggleSort} />
            <SortableHeader label="평가 손익" sortKey="profit" sort={sort} onToggle={toggleSort} />
            <th className={headerCellClass}>
              <span className="sr-only">수정/삭제</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 dark:divide-white/5">
          {sortedAssets.map((asset) => {
            const { principal, valuation, profit, profitRate } = getAssetMetrics(asset, usdKrw);
            const isProfit = profit >= 0;
            const sub = subLine(asset);
            const weight = groupTotal === 0 ? 0 : (valuation / groupTotal) * 100;

            return (
              <tr
                key={asset.id}
                onClick={() => openEditModal(asset)}
                className="group cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-white/5"
              >
                <td className="px-4 py-3.5">
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {asset.name}
                    {asset.currency === "USD" && (
                      <span className="ml-1.5 rounded bg-gray-100 px-1 py-0.5 text-[10px] font-semibold text-gray-500 dark:bg-white/10 dark:text-gray-400">
                        USD
                      </span>
                    )}
                  </p>
                  {sub && (
                    <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{sub}</p>
                  )}
                </td>
                <td className="px-4 py-3.5 text-gray-500 dark:text-gray-400">
                  {getAssetCategoryLabel(asset)}
                </td>
                <td className="px-4 py-3.5 text-right text-gray-700 dark:text-gray-300">
                  {asset.type === "STOCK" ? `${asset.quantity.toLocaleString("ko-KR")}주` : "-"}
                </td>
                <td className="px-4 py-3.5 text-right text-gray-700 dark:text-gray-300">
                  {formatMoney(principal, displayCurrency, usdKrw)}
                </td>
                <td className="px-4 py-3.5 text-right font-medium text-gray-900 dark:text-gray-100">
                  {formatMoney(valuation, displayCurrency, usdKrw)}
                </td>
                <td className="px-4 py-3.5 text-right text-gray-700 [font-variant-numeric:tabular-nums] dark:text-gray-300">
                  {weight.toFixed(1)}%
                </td>
                <td className="px-4 py-3.5 text-right">
                  {asset.type === "CASH" ? (
                    <span className="text-gray-400 dark:text-gray-500">-</span>
                  ) : (
                    <span className={`font-medium ${isProfit ? "text-rise" : "text-fall"}`}>
                      {formatSignedMoney(profit, displayCurrency, usdKrw)} ({formatPercent(profitRate)})
                    </span>
                  )}
                </td>
                <td className="w-20 px-2 py-3.5">
                  <div className="flex items-center justify-center gap-0.5">
                    <button
                      type="button"
                      aria-label={`${asset.name} 수정`}
                      onClick={(event) => {
                        event.stopPropagation();
                        openEditModal(asset);
                      }}
                      className="rounded-lg p-2 text-gray-300 opacity-70 transition-colors hover:bg-gray-900/5 hover:text-gray-600 group-hover:opacity-100 dark:text-gray-600 dark:hover:bg-white/10 dark:hover:text-gray-300"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      aria-label={`${asset.name} 삭제`}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleDelete(asset);
                      }}
                      className="rounded-lg p-2 text-gray-300 opacity-70 transition-colors hover:bg-fall/10 hover:text-fall group-hover:opacity-100 dark:text-gray-600 dark:hover:bg-fall/15 dark:hover:text-fall"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
