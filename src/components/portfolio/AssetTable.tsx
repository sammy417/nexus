"use client";

import { Trash2 } from "lucide-react";
import { getAssetMetrics } from "@/lib/services/portfolio-service";
import { useAssetModal } from "@/lib/asset-modal-context";
import { usePortfolio } from "@/lib/portfolio-context";
import { formatKRW, formatPercent, formatSigned } from "@/lib/format";
import { ASSET_TYPE_LABEL } from "@/lib/models/asset-types";
import { Asset } from "@/lib/models/asset";

const headerCellClass =
  "px-4 py-3 text-xs font-medium text-gray-400 dark:text-gray-500";

export default function AssetTable({ assets }: { assets: Asset[] }) {
  const { openEditModal, showToast } = useAssetModal();
  const { deleteAsset } = usePortfolio();

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

  return (
    <div className="overflow-x-auto rounded-2xl bg-white shadow-sm dark:bg-card-dark">
      <table className="w-full min-w-[680px] text-sm">
        <thead>
          <tr className="border-b border-border text-left dark:border-border-dark">
            <th className={headerCellClass}>자산</th>
            <th className={headerCellClass}>종류</th>
            <th className={`${headerCellClass} text-right`}>보유 수량</th>
            <th className={`${headerCellClass} text-right`}>투자 원금</th>
            <th className={`${headerCellClass} text-right`}>평가 금액</th>
            <th className={`${headerCellClass} text-right`}>평가 손익</th>
            <th className={headerCellClass}>
              <span className="sr-only">삭제</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 dark:divide-white/5">
          {assets.map((asset) => {
            const { principal, valuation, profit, profitRate } = getAssetMetrics(asset);
            const isProfit = profit >= 0;

            return (
              <tr
                key={asset.id}
                onClick={() => openEditModal(asset)}
                className="group cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-white/5"
              >
                <td className="px-4 py-3.5">
                  <p className="font-medium text-gray-900 dark:text-gray-100">{asset.name}</p>
                  {asset.type === "STOCK" && (asset.market || asset.ticker) && (
                    <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                      {[asset.market, asset.ticker].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  {asset.type === "BOND" && (asset.couponRate !== undefined || asset.maturityDate) && (
                    <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                      {[
                        asset.couponRate !== undefined ? `표면 ${asset.couponRate}%` : null,
                        asset.maturityDate ? `만기 ${asset.maturityDate}` : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3.5 text-gray-500 dark:text-gray-400">
                  {ASSET_TYPE_LABEL[asset.type]}
                </td>
                <td className="px-4 py-3.5 text-right text-gray-700 dark:text-gray-300">
                  {asset.type === "STOCK" ? `${asset.quantity.toLocaleString("ko-KR")}주` : "-"}
                </td>
                <td className="px-4 py-3.5 text-right text-gray-700 dark:text-gray-300">
                  {formatKRW(principal)}
                </td>
                <td className="px-4 py-3.5 text-right font-medium text-gray-900 dark:text-gray-100">
                  {formatKRW(valuation)}
                </td>
                <td className="px-4 py-3.5 text-right">
                  {asset.type === "CASH" ? (
                    <span className="text-gray-400 dark:text-gray-500">-</span>
                  ) : (
                    <span className={`font-medium ${isProfit ? "text-rise" : "text-fall"}`}>
                      {formatSigned(profit)} ({formatPercent(profitRate)})
                    </span>
                  )}
                </td>
                <td className="w-12 px-2 py-3.5 text-center">
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
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
