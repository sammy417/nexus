"use client";

import { useState } from "react";
import { DIVIDEND_TAX_RATE, DividendRecord } from "@/lib/models/dividend";
import { getFinancialIncomeSummary, getYearEndDividendProjection } from "@/lib/services/tax-service";
import type { HoldingDividendForecast } from "@/lib/services/dividend-forecast-service";
import MoneyInput from "@/components/common/MoneyInput";
import { Skeleton } from "@/components/common/Skeleton";
import DataErrorNotice from "@/components/common/DataErrorNotice";
import { useDisplayCurrency } from "@/lib/currency-context";
import { useT } from "@/lib/i18n/locale-context";

const OVER_COLOR = "#F04452";
const UNDER_COLOR = "#1baf7a";

const inputClass =
  "rounded-xl bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-300 focus:ring-2 focus:ring-gray-900/10 dark:bg-white/5 dark:text-gray-100 dark:placeholder:text-gray-600 dark:focus:ring-white/10";

function Gauge({
  label,
  amountKrw,
  thresholdKrw,
  overThreshold,
  excessKrw,
  overNote,
  remainingNote,
  money,
  t,
}: {
  label: string;
  amountKrw: number;
  thresholdKrw: number;
  overThreshold: boolean;
  excessKrw: number;
  overNote: string;
  remainingNote: string;
  money: (krw: number) => string;
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  const ratio = (amountKrw / thresholdKrw) * 100;
  const barPct = Math.min(100, ratio);
  const color = overThreshold ? OVER_COLOR : UNDER_COLOR;

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-lg font-bold tracking-tight text-gray-900 dark:text-gray-100">
          {money(amountKrw)}
        </p>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-white/5">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${Math.max(barPct, amountKrw > 0 ? 2 : 0)}%`, backgroundColor: color }}
        />
      </div>
      <p
        className={`mt-1.5 text-[11px] ${overThreshold ? "font-medium text-fall" : "text-gray-400 dark:text-gray-500"}`}
      >
        {overThreshold ? t(overNote, { excess: money(excessKrw) }) : t(remainingNote, { remaining: money(thresholdKrw - amountKrw) })}
      </p>
    </div>
  );
}

/**
 * 올해 배당·이자소득 합계(+미기록분 보정, +연말까지 예상 추가분)가 금융
 * 소득종합과세 기준금액에 얼마나 가까운지 보여준다.
 */
export default function FinancialIncomeCard({
  records,
  forecastHoldings,
  isForecastLoading,
  forecastHasError = false,
}: {
  records: DividendRecord[];
  forecastHoldings: HoldingDividendForecast[];
  isForecastLoading: boolean;
  /** Forecast lookup failed — the year-end projection is understated. */
  forecastHasError?: boolean;
}) {
  const { usdKrw, money } = useDisplayCurrency();
  const t = useT();
  const [manualAdjustment, setManualAdjustment] = useState("");

  const projectedRemainingKrw = isForecastLoading
    ? 0
    : getYearEndDividendProjection(forecastHoldings);
  const summary = getFinancialIncomeSummary(
    records,
    usdKrw,
    Number(manualAdjustment) || 0,
    projectedRemainingKrw
  );

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-card-dark">
      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
        {t("금융소득종합과세 트래커")}
      </p>
      <p className="mt-0.5 text-[11px] leading-relaxed text-gray-400 dark:text-gray-500">
        {t(
          "배당·이자 합계가 기준금액을 넘으면 초과분이 다른 소득과 합산되어 종합과세됩니다(기준 이하는 {rate}% 원천징수로 종결). 기준 {threshold}",
          { rate: (DIVIDEND_TAX_RATE * 100).toFixed(1), threshold: money(summary.thresholdKrw) }
        )}
      </p>

      <label className="mt-4 flex flex-col gap-1.5">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
          {t("기록되지 않은 배당·이자 (선택, 세전)")}
        </span>
        <MoneyInput
          value={manualAdjustment}
          onChange={setManualAdjustment}
          currency="KRW"
          placeholder="0"
          className={`max-w-[12rem] ${inputClass}`}
        />
      </label>

      <div className="mt-4 flex flex-col gap-4">
        <Gauge
          label={t("지금까지 (기록 + 위 보정액)")}
          amountKrw={summary.currentIncomeKrw}
          thresholdKrw={summary.thresholdKrw}
          overThreshold={summary.currentOverThreshold}
          excessKrw={summary.currentExcessKrw}
          overNote="기준금액을 {excess} 초과했습니다 — 초과분은 다음 해 5월 종합소득세 신고 대상입니다."
          remainingNote="기준금액까지 {remaining} 남았습니다."
          money={money}
          t={t}
        />

        <div className="border-t border-border pt-4 dark:border-border-dark">
          {isForecastLoading ? (
            <Skeleton className="h-14 w-full rounded-xl" />
          ) : (
            <>
              <Gauge
                label={t("연말까지 예상 (배당률·보유 수량 유지 가정)")}
                amountKrw={summary.projectedYearEndKrw}
                thresholdKrw={summary.thresholdKrw}
                overThreshold={summary.projectedOverThreshold}
                excessKrw={summary.projectedExcessKrw}
                overNote="이대로면 연말까지 기준금액을 {excess} 초과할 것으로 예상됩니다."
                remainingNote="이대로면 연말까지 기준금액에 {remaining} 못 미칠 것으로 예상됩니다."
                money={money}
                t={t}
              />
              {forecastHasError && (
                <DataErrorNotice
                  className="mt-2.5"
                  message="배당 예측을 불러오지 못해 연말 예상에 추가 배당이 반영되지 않았습니다 — 실제 금액은 이보다 클 수 있습니다."
                />
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
