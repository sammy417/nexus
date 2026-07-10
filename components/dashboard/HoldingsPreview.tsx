import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Holding } from "@/lib/types";
import { formatKRW, formatPercent } from "@/lib/format";
import { getHoldingMetrics } from "@/lib/portfolio";

export default function HoldingsPreview({ holdings }: { holdings: Holding[] }) {
  return (
    <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900">보유 종목</p>
        <Link
          href="/portfolio"
          className="flex items-center gap-0.5 text-xs font-medium text-gray-400"
        >
          전체보기
          <ChevronRight size={14} />
        </Link>
      </div>

      <ul className="mt-4 divide-y divide-gray-50">
        {holdings.map((holding) => {
          const { valuation, profitRate } = getHoldingMetrics(holding);
          const isProfit = profitRate >= 0;

          return (
            <li key={holding.id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{holding.name}</p>
                <p className="text-xs text-gray-400">{holding.ticker}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {formatKRW(valuation)}
                </p>
                <p className={`text-xs font-medium ${isProfit ? "text-rise" : "text-fall"}`}>
                  {formatPercent(profitRate)}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
