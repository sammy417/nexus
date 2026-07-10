import { TrendingDown, TrendingUp } from "lucide-react";
import { formatKRW, formatPercent, formatSigned } from "@/lib/format";
import { PortfolioSummary } from "@/lib/portfolio";

export default function AssetSummary({ summary }: { summary: PortfolioSummary }) {
  const { totalValuation, totalPrincipal, totalProfit, totalProfitRate } = summary;
  const isProfit = totalProfit >= 0;
  const toneClass = isProfit ? "text-rise" : "text-fall";

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-gray-400">총 자산 평가 금액</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
        {formatKRW(totalValuation)}
      </p>

      <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-5">
        <div>
          <p className="text-xs font-medium text-gray-400">총 투자 원금</p>
          <p className="mt-1 text-base font-semibold text-gray-700">
            {formatKRW(totalPrincipal)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-medium text-gray-400">평가 손익</p>
          <div className={`mt-1 flex items-center justify-end gap-1 text-base font-semibold ${toneClass}`}>
            {isProfit ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            <span>{formatSigned(totalProfit)}</span>
            <span className="text-sm">({formatPercent(totalProfitRate)})</span>
          </div>
        </div>
      </div>
    </section>
  );
}
