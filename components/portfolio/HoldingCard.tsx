import { Holding } from "@/lib/types";
import { formatKRW, formatPercent } from "@/lib/format";
import { getHoldingMetrics } from "@/lib/portfolio";

export default function HoldingCard({ holding }: { holding: Holding }) {
  const { valuation, profitRate } = getHoldingMetrics(holding);
  const isProfit = profitRate >= 0;
  const toneClass = isProfit ? "text-rise" : "text-fall";

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-base font-semibold text-gray-900">{holding.name}</p>
          <p className="mt-0.5 text-xs text-gray-400">{holding.ticker}</p>
        </div>
        <div className="text-right">
          <p className="text-base font-semibold text-gray-900">
            {formatKRW(valuation)}
          </p>
          <p className={`mt-0.5 text-xs font-medium ${toneClass}`}>
            {formatPercent(profitRate)}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-gray-100 pt-4">
        <div>
          <p className="text-[11px] text-gray-400">보유 수량</p>
          <p className="mt-0.5 text-sm font-medium text-gray-700">
            {holding.quantity.toLocaleString("ko-KR")}주
          </p>
        </div>
        <div>
          <p className="text-[11px] text-gray-400">평단가</p>
          <p className="mt-0.5 text-sm font-medium text-gray-700">
            {formatKRW(holding.avgPrice)}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-gray-400">현재가</p>
          <p className="mt-0.5 text-sm font-medium text-gray-700">
            {formatKRW(holding.currentPrice)}
          </p>
        </div>
      </div>
    </div>
  );
}
