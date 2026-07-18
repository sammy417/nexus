"use client";

import { getAssetMetrics } from "@/lib/services/portfolio-service";
import { useAssetModal } from "@/lib/asset-modal-context";
import { formatKRW, formatPercent, formatSigned } from "@/lib/format";
import { ASSET_TYPE_LABEL } from "@/lib/models/asset-types";
import { Asset } from "@/lib/models/asset";

const headerCellClass =
  "px-4 py-3 text-xs font-medium text-gray-400 dark:text-gray-500";

export default function AssetTable({ assets }: { assets: Asset[] }) {
  const { openEditModal } = useAssetModal();

  return (
    <div className="overflow-x-auto rounded-2xl bg-white shadow-sm dark:bg-card-dark">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-border text-left dark:border-border-dark">
            <th className={headerCellClass}>자산</th>
            <th className={headerCellClass}>종류</th>
            <th className={`${headerCellClass} text-right`}>보유 수량</th>
            <th className={`${headerCellClass} text-right`}>투자 원금</th>
            <th className={`${headerCellClass} text-right`}>평가 금액</th>
            <th className={`${headerCellClass} text-right`}>평가 손익</th>
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
                className="cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-white/5"
              >
                <td className="px-4 py-3.5">
                  <p className="font-medium text-gray-900 dark:text-gray-100">{asset.name}</p>
                  {asset.type === "STOCK" && (asset.market || asset.ticker) && (
                    <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                      {[asset.market, asset.ticker].filter(Boolean).join(" · ")}
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
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
