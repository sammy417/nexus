"use client";

import { getAssetMetrics } from "@/lib/asset";
import { useAssetModal } from "@/lib/asset-modal-context";
import { formatKRW, formatPercent } from "@/lib/format";
import { Asset } from "@/lib/types";

export default function AssetCard({ asset }: { asset: Asset }) {
  const { openEditModal } = useAssetModal();
  const { valuation, profitRate } = getAssetMetrics(asset);
  const isProfit = profitRate >= 0;
  const toneClass = isProfit ? "text-rise" : "text-fall";

  return (
    <button
      type="button"
      onClick={() => openEditModal(asset)}
      className="w-full rounded-2xl bg-white p-5 text-left shadow-sm transition-colors hover:bg-gray-50"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-base font-semibold text-gray-900">{asset.name}</p>
          {asset.type === "STOCK" && asset.ticker && (
            <p className="mt-0.5 text-xs text-gray-400">{asset.ticker}</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-base font-semibold text-gray-900">{formatKRW(valuation)}</p>
          {asset.type !== "CASH" && (
            <p className={`mt-0.5 text-xs font-medium ${toneClass}`}>
              {formatPercent(profitRate)}
            </p>
          )}
        </div>
      </div>

      {asset.type === "STOCK" && (
        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-gray-100 pt-4">
          <div>
            <p className="text-[11px] text-gray-400">보유 수량</p>
            <p className="mt-0.5 text-sm font-medium text-gray-700">
              {asset.quantity.toLocaleString("ko-KR")}주
            </p>
          </div>
          <div>
            <p className="text-[11px] text-gray-400">평단가</p>
            <p className="mt-0.5 text-sm font-medium text-gray-700">
              {formatKRW(asset.avgPrice)}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-gray-400">현재가</p>
            <p className="mt-0.5 text-sm font-medium text-gray-700">
              {formatKRW(asset.currentPrice)}
            </p>
          </div>
        </div>
      )}

      {asset.type === "REAL_ESTATE" && (
        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-gray-100 pt-4">
          <div>
            <p className="text-[11px] text-gray-400">매입가</p>
            <p className="mt-0.5 text-sm font-medium text-gray-700">
              {formatKRW(asset.purchasePrice)}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-gray-400">현재 시세</p>
            <p className="mt-0.5 text-sm font-medium text-gray-700">
              {formatKRW(asset.currentValue)}
            </p>
          </div>
        </div>
      )}
    </button>
  );
}
