import { TrendingDown, TrendingUp } from "lucide-react";
import { formatKRW, formatPercent, formatSigned } from "@/lib/format";
import { PortfolioSummary } from "@/lib/services/portfolio-service";

export default function AssetSummary({ summary }: { summary: PortfolioSummary }) {
  const { totalValuation, totalPrincipal, totalProfit, totalProfitRate } = summary;
  const isProfit = totalProfit >= 0;
  const toneClass = isProfit ? "text-rise" : "text-fall";

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-card-dark">
      <p className="text-sm font-medium text-gray-400 dark:text-gray-500">총 자산 평가 금액</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
        {formatKRW(totalValuation)}
      </p>

      <div className="mt-6 flex flex-col gap-3 border-t border-border pt-5 dark:border-border-dark">
        <div className="flex items-center justify-between gap-3">
          <p className="shrink-0 text-xs font-medium text-gray-400 dark:text-gray-500">총 투자 원금</p>
          <p className="truncate text-sm font-semibold text-gray-700 dark:text-gray-300">
            {formatKRW(totalPrincipal)}
          </p>
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="shrink-0 text-xs font-medium text-gray-400 dark:text-gray-500">평가 손익</p>
          <div className={`flex min-w-0 items-center gap-1 text-sm font-semibold ${toneClass}`}>
            {isProfit ? <TrendingUp size={14} className="shrink-0" /> : <TrendingDown size={14} className="shrink-0" />}
            <span className="truncate">{formatSigned(totalProfit)}</span>
            <span className="shrink-0">({formatPercent(totalProfitRate)})</span>
          </div>
        </div>
      </div>
    </section>
  );
}
