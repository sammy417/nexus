"use client";

import { getAssetMetrics } from "@/lib/services/portfolio-service";
import { useAssetModal } from "@/lib/asset-modal-context";
import { formatKRW, formatPercent } from "@/lib/format";
import { Asset } from "@/lib/models/asset";

export default function AssetCard({ asset }: { asset: Asset }) {
  const { openEditModal } = useAssetModal();
  const { valuation, profitRate } = getAssetMetrics(asset);
  const isProfit = profitRate >= 0;
  const toneClass = isProfit ? "text-rise" : "text-fall";

  return (
    <button
      type="button"
      onClick={() => openEditModal(asset)}
      className="w-full rounded-2xl bg-white p-5 text-left shadow-sm transition-colors hover:bg-gray-50 dark:bg-card-dark dark:hover:bg-white/5"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-base font-semibold text-gray-900 dark:text-gray-100">{asset.name}</p>
          {asset.type === "STOCK" && asset.ticker && (
            <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
              {[asset.market, asset.ticker].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {formatKRW(valuation)}
          </p>
          {asset.type !== "CASH" && (
            <p className={`mt-0.5 text-xs font-medium ${toneClass}`}>
              {formatPercent(profitRate)}
            </p>
          )}
        </div>
      </div>

      {asset.type === "STOCK" && (
        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-4 dark:border-border-dark">
          <div>
            <p className="text-[11px] text-gray-400 dark:text-gray-500">보유 수량</p>
            <p className="mt-0.5 text-sm font-medium text-gray-700 dark:text-gray-300">
              {asset.quantity.toLocaleString("ko-KR")}주
            </p>
          </div>
          <div>
            <p className="text-[11px] text-gray-400 dark:text-gray-500">평단가</p>
            <p className="mt-0.5 text-sm font-medium text-gray-700 dark:text-gray-300">
              {formatKRW(asset.avgPrice)}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-gray-400 dark:text-gray-500">현재가</p>
            <p className="mt-0.5 text-sm font-medium text-gray-700 dark:text-gray-300">
              {formatKRW(asset.currentPrice)}
            </p>
          </div>
        </div>
      )}
    </button>
  );
}
