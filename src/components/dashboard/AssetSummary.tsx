import { TrendingDown, TrendingUp } from "lucide-react";
import { formatKRW, formatPercent, formatSigned } from "@/lib/format";
import { PortfolioSummary } from "@/lib/services/portfolio-service";

export default function AssetSummary({ summary }: { summary: PortfolioSummary }) {
  const { totalValuation, totalPrincipal, totalProfit, totalProfitRate } = summary;
  const isProfit = totalProfit >= 0;
  const toneClass = isProfit ? "text-rise" : "text-fall";

  return (
    <section className="flex h-full flex-col justify-between rounded-2xl bg-white p-7 shadow-sm dark:bg-card-dark">
      <div>
        <p className="text-sm font-medium text-gray-400 dark:text-gray-500">총 자산 평가 금액</p>
        <p className="mt-2 text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          {formatKRW(totalValuation)}
        </p>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-6 border-t border-border pt-6 dark:border-border-dark">
        <div>
          <p className="text-xs font-medium text-gray-400 dark:text-gray-500">총 투자 원금</p>
          <p className="mt-1.5 truncate text-lg font-semibold text-gray-700 dark:text-gray-300">
            {formatKRW(totalPrincipal)}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-400 dark:text-gray-500">평가 손익</p>
          <div className={`mt-1.5 flex min-w-0 items-center gap-1.5 text-lg font-semibold ${toneClass}`}>
            {isProfit ? <TrendingUp size={16} className="shrink-0" /> : <TrendingDown size={16} className="shrink-0" />}
            <span className="truncate">{formatSigned(totalProfit)}</span>
            <span className="shrink-0 text-sm">({formatPercent(totalProfitRate)})</span>
          </div>
        </div>
      </div>
    </section>
  );
}
