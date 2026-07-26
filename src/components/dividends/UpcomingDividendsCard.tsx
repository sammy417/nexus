"use client";

import { useState } from "react";
import { CalendarClock, ChevronDown } from "lucide-react";
import type { DividendForecast } from "@/lib/services/dividend-forecast-service";
import { Skeleton } from "@/components/common/Skeleton";
import { useDisplayCurrency } from "@/lib/currency-context";

/** Rows shown before the "더보기" toggle. */
const DEFAULT_VISIBLE = 5;

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
  const { money } = useDisplayCurrency();
  const [expanded, setExpanded] = useState(false);

  const upcoming = (forecast?.holdings ?? [])
    .filter((h) => h.nextExDateEstimate !== null && h.nextAmountKrw !== null)
    .sort((a, b) => a.nextExDateEstimate!.localeCompare(b.nextExDateEstimate!));
  const hiddenCount = upcoming.length - DEFAULT_VISIBLE;
  const isCollapsible = hiddenCount > 0;
  const visibleUpcoming = isCollapsible && !expanded ? upcoming.slice(0, DEFAULT_VISIBLE) : upcoming;

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-card-dark">
      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">다가오는 배당</p>
      <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
        과거 지급 주기 기반 추정 — 확정 공시가 아닙니다
      </p>

      {isLoading ? (
        <div className="mt-4 flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
              <div className="flex flex-1 flex-col gap-1.5">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      ) : upcoming.length === 0 ? (
        <p className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">
          추정할 배당 일정이 없습니다.
        </p>
      ) : (
        <ul className="mt-4 flex flex-col divide-y divide-gray-50 dark:divide-white/5">
          {visibleUpcoming.map((holding) => {
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
                  {money(holding.nextAmountKrw!)}
                </p>
              </li>
            );
          })}
          {isCollapsible && (
            <li>
              <button
                type="button"
                onClick={() => setExpanded((prev) => !prev)}
                className="flex w-full items-center justify-center gap-1 rounded-lg py-2.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200"
              >
                {expanded ? "접기" : `더보기 (${hiddenCount}개 더)`}
                <ChevronDown
                  size={14}
                  className={`transition-transform ${expanded ? "rotate-180" : ""}`}
                />
              </button>
            </li>
          )}
        </ul>
      )}
    </section>
  );
}
