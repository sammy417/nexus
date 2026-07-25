"use client";

import type {
  DividendForecast,
  HoldingDividendForecast,
} from "@/lib/services/dividend-forecast-service";
import { DIVIDEND_TAX_RATE } from "@/lib/models/dividend";
import { formatMoney } from "@/lib/format";
import { useDisplayCurrency } from "@/lib/currency-context";

function formatPerShare(value: number, currency: string): string {
  if (currency === "USD") {
    return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `₩${Math.round(value).toLocaleString("ko-KR")}`;
}

function payers(holdings: HoldingDividendForecast[]): HoldingDividendForecast[] {
  return holdings.filter((h) => h.perShareTrailing12m > 0);
}

/** 보유 종목 배당 이력 기반 연간 예상 배당 + 배당수익률 (세전 추정). */
export default function DividendForecastCard({
  forecast,
  isLoading,
}: {
  forecast: DividendForecast | null;
  isLoading: boolean;
}) {
  const { displayCurrency, usdKrw } = useDisplayCurrency();

  const paying = forecast ? payers(forecast.holdings) : [];
  const nonPaying = forecast ? forecast.holdings.length - paying.length : 0;
  // Totals derived from the (possibly owner-filtered) holdings passed in.
  const totalAnnualKrw = paying.reduce((sum, h) => sum + h.annualEstimateKrw, 0);
  const totalValuationKrw = paying.reduce((sum, h) => sum + h.valuationKrw, 0);
  const yieldPct = totalValuationKrw > 0 ? (totalAnnualKrw / totalValuationKrw) * 100 : null;
  const afterTaxKrw = totalAnnualKrw * (1 - DIVIDEND_TAX_RATE);

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-card-dark">
      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">예상 연간 배당</p>
      <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
        보유 종목의 최근 12개월 배당 이력 × 현재 보유 수량 · 세전 추정
      </p>

      {isLoading ? (
        <p className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">
          배당 정보를 조회하는 중...
        </p>
      ) : !forecast || paying.length === 0 ? (
        <p className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">
          배당 이력이 조회된 보유 종목이 없습니다.
        </p>
      ) : (
        <>
          <div className="mt-4 flex items-baseline gap-3">
            <p className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              {formatMoney(totalAnnualKrw, displayCurrency, usdKrw)}
            </p>
            {yieldPct !== null && (
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                배당수익률 {yieldPct.toFixed(2)}%
              </p>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            세후 약 {formatMoney(afterTaxKrw, displayCurrency, usdKrw)}
            <span className="ml-1">(원천징수 {(DIVIDEND_TAX_RATE * 100).toFixed(1)}% 가정)</span>
          </p>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[430px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-medium text-gray-400 dark:border-border-dark dark:text-gray-500">
                  <th className="py-2 pr-3">종목</th>
                  <th className="py-2 pr-3 text-right">주당 배당 (12개월)</th>
                  <th className="py-2 pr-3 text-right">예상 연간 수령액</th>
                  <th className="py-2 text-right">시가 배당률</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                {paying.map((holding) => (
                  <tr key={holding.assetId}>
                    <td className="py-2.5 pr-3">
                      <p className="font-medium text-gray-900 dark:text-gray-100">{holding.name}</p>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500">
                        {holding.ticker} · {holding.quantity.toLocaleString("ko-KR")}주
                      </p>
                    </td>
                    <td className="py-2.5 pr-3 text-right text-gray-700 [font-variant-numeric:tabular-nums] dark:text-gray-300">
                      {formatPerShare(holding.perShareTrailing12m, holding.currency)}
                    </td>
                    <td className="py-2.5 pr-3 text-right font-medium text-gray-900 [font-variant-numeric:tabular-nums] dark:text-gray-100">
                      {formatMoney(holding.annualEstimateKrw, displayCurrency, usdKrw)}
                    </td>
                    <td className="py-2.5 text-right text-gray-700 [font-variant-numeric:tabular-nums] dark:text-gray-300">
                      {holding.yieldPct === null ? "-" : `${holding.yieldPct.toFixed(2)}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(nonPaying > 0 || forecast.failedTickers.length > 0) && (
            <p className="mt-3 text-[11px] leading-relaxed text-gray-400 dark:text-gray-500">
              {nonPaying > 0 && <>배당 이력이 없는 종목 {nonPaying}개는 제외했습니다. </>}
              {forecast.failedTickers.length > 0 && (
                <>조회 실패: {forecast.failedTickers.join(", ")}</>
              )}
            </p>
          )}
        </>
      )}
    </section>
  );
}
