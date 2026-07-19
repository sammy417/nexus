"use client";

import { CalendarClock } from "lucide-react";
import type { DividendForecast } from "@/lib/services/dividend-forecast-service";
import { formatMoney } from "@/lib/format";
import { useDisplayCurrency } from "@/lib/currency-context";

function frequencyLabel(perYear: number): string {
  if (perYear >= 10) return "월배당";
  if (perYear >= 4) return "분기";
  if (perYear >= 2) return "반기";
  return "연간";
}

function formatEstimateDate(date: string): string {
  const [, month, day] = date.split("-");
  return `~${Number(month)}월 ${Number(day)}일`;
}

function daysUntil(date: string): number {
  return Math.max(0, Math.round((new Date(date).getTime() - Date.now()) / 86400000));
}

/** 과거 지급 주기로 추정한 다음 배당락 일정 (공시 아님). */
export default function UpcomingDividendsCard({
  forecast,
  isLoading,
}: {
  forecast: DividendForecast | null;
  isLoading: boolean;
}) {
  const { displayCurrency, usdKrw } = useDisplayCurrency();

  const upcoming = (forecast?.holdings ?? [])
    .filter((h) => h.nextExDateEstimate !== null && h.nextAmountKrw !== null)
    .sort((a, b) => a.nextExDateEstimate!.localeCompare(b.nextExDateEstimate!));

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-card-dark">
      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">다가오는 배당</p>
      <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
        과거 지급 주기 기반 추정 — 확정 공시가 아닙니다
      </p>

      {isLoading ? (
        <p className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">
          배당 정보를 조회하는 중...
        </p>
      ) : upcoming.length === 0 ? (
        <p className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">
          추정할 배당 일정이 없습니다.
        </p>
      ) : (
        <ul className="mt-4 flex flex-col divide-y divide-gray-50 dark:divide-white/5">
          {upcoming.map((holding) => {
            const days = daysUntil(holding.nextExDateEstimate!);
            return (
              <li key={holding.assetId} className="flex items-center justify-between gap-3 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-50 text-gray-400 dark:bg-white/5 dark:text-gray-500">
                    <CalendarClock size={16} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                      {holding.name}
                    </p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500">
                      {frequencyLabel(holding.frequencyPerYear)} ·{" "}
                      {formatEstimateDate(holding.nextExDateEstimate!)} 예상
                      {days > 0 && ` (D-${days})`}
                    </p>
                  </div>
                </div>
                <p className="shrink-0 text-sm font-semibold text-gray-900 [font-variant-numeric:tabular-nums] dark:text-gray-100">
                  {formatMoney(holding.nextAmountKrw!, displayCurrency, usdKrw)}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
