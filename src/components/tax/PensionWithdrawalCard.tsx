"use client";

import { useMemo, useState } from "react";
import { Asset } from "@/lib/models/asset";
import { PENSION_SEPARATE_TAX_THRESHOLD_KRW } from "@/lib/models/tax";
import { getPensionWithdrawal } from "@/lib/services/tax-service";
import { getAssetMetrics } from "@/lib/services/portfolio-service";
import { useDisplayCurrency } from "@/lib/currency-context";
import { useT } from "@/lib/i18n/locale-context";

const inputClass =
  "rounded-xl bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-300 focus:ring-2 focus:ring-gray-900/10 dark:bg-white/5 dark:text-gray-100 dark:placeholder:text-gray-600 dark:focus:ring-white/10";

const OVER = "#c98500";
const UNDER = "#1baf7a";

const PERIOD_PRESETS = [10, 20, 30];

/**
 * 연금 수령 시뮬레이터 — the credit card's counterpart (받을 때). Draws the
 * owner's private-pension balance (연금저축·IRP) down as a level annuity and
 * shows the monthly payout, the 연금소득세, and — the point of it — whether
 * the annual payout clears the 1,500만원 low-rate line, with the shortest
 * period that keeps it under.
 */
export default function PensionWithdrawalCard({ pensionAssets }: { pensionAssets: Asset[] }) {
  const { usdKrw, money } = useDisplayCurrency();
  const t = useT();

  const [startAge, setStartAge] = useState(60);
  const [years, setYears] = useState(20);
  const [returnPct, setReturnPct] = useState(4);

  const balanceKrw = useMemo(
    () => pensionAssets.reduce((sum, a) => sum + getAssetMetrics(a, usdKrw).valuation, 0),
    [pensionAssets, usdKrw]
  );

  const result = getPensionWithdrawal(balanceKrw, startAge, Math.max(1, years), returnPct);

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-card-dark">
      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t("연금 수령 시뮬레이터")}</p>
      <p className="mt-0.5 text-[11px] leading-relaxed text-gray-400 dark:text-gray-500">
        {t(
          "보유한 사적연금(연금저축·IRP) 잔액을 수령 기간에 걸쳐 나눠 받을 때의 월 수령액과 연금소득세를 추정합니다. 국민연금은 포함하지 않으며, 확정 세액이 아닌 추정치입니다."
        )}
      </p>

      <div className="mt-4 flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 dark:bg-white/5">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{t("연금 잔액")}</span>
        <span className="text-sm font-bold text-gray-900 [font-variant-numeric:tabular-nums] dark:text-gray-100">
          {money(balanceKrw)}
        </span>
      </div>

      {/* Inputs */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{t("수령 시작 나이")}</span>
          <input
            type="number"
            inputMode="numeric"
            min={55}
            value={startAge || ""}
            onChange={(e) => setStartAge(Number(e.target.value) || 0)}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{t("수령 중 기대 수익률 (연)")}</span>
          <div className="flex items-center gap-1">
            <input
              type="number"
              inputMode="decimal"
              step="0.5"
              value={returnPct || ""}
              onChange={(e) => setReturnPct(Number(e.target.value) || 0)}
              className={`w-full ${inputClass}`}
            />
            <span className="text-xs text-gray-400 dark:text-gray-500">%</span>
          </div>
        </label>
      </div>

      <div className="mt-3 flex flex-col gap-1.5">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{t("수령 기간")}</span>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 rounded-lg bg-gray-50 p-0.5 dark:bg-white/5">
            {PERIOD_PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setYears(p)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  years === p
                    ? "bg-white text-gray-900 shadow-sm dark:bg-white/15 dark:text-gray-100"
                    : "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                }`}
              >
                {t("{n}년", { n: p })}
              </button>
            ))}
          </div>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            value={years || ""}
            onChange={(e) => setYears(Number(e.target.value) || 0)}
            className={`w-20 text-right ${inputClass}`}
            aria-label={t("수령 기간")}
          />
          <span className="text-xs text-gray-400 dark:text-gray-500">{t("년")}</span>
        </div>
      </div>

      {/* Results */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Metric label={t("월 수령액 (세전)")} value={money(result.monthlyGrossKrw)} />
        <Metric label={t("월 실수령액")} value={money(result.monthlyNetKrw)} strong />
        <Metric
          label={t("연금소득세 (연, {rate}%)", { rate: (result.effectiveTaxRate * 100).toFixed(1) })}
          value={money(result.annualTaxKrw)}
        />
      </div>

      {/* Threshold guidance — the reason this card exists. */}
      {balanceKrw > 0 && (
        <div
          className="mt-4 rounded-xl px-4 py-3 text-[11px] leading-relaxed"
          style={{
            backgroundColor: `${result.overThreshold ? OVER : UNDER}14`,
            color: result.overThreshold ? OVER : UNDER,
          }}
        >
          {result.overThreshold
            ? result.suggestedYearsUnderThreshold
              ? t(
                  "연 수령액이 {threshold}을 넘어 종합과세 또는 16.5% 분리과세 대상입니다. 수령 기간을 {years}년 이상으로 늘리면 연 수령액이 한도 아래로 내려가 연령별 저율 분리과세(5.5~3.3%)로 종결됩니다.",
                  { threshold: money(PENSION_SEPARATE_TAX_THRESHOLD_KRW), years: result.suggestedYearsUnderThreshold }
                )
              : t(
                  "연 수령액이 {threshold}을 넘어 종합과세 또는 16.5% 분리과세 대상입니다. 잔액이 커서 수령 기간을 늘려도 한도 아래로 내리기 어렵습니다.",
                  { threshold: money(PENSION_SEPARATE_TAX_THRESHOLD_KRW) }
                )
            : t(
                "연 수령액이 {threshold} 이하라 연령별 저율 분리과세로 종결됩니다(수령 시작 시점 {rate}%, 나이가 들수록 낮아집니다).",
                { threshold: money(PENSION_SEPARATE_TAX_THRESHOLD_KRW), rate: (result.startAgeRate * 100).toFixed(1) }
              )}
        </div>
      )}

      <p className="mt-2 text-[11px] leading-relaxed text-gray-400 dark:text-gray-500">
        {t(
          "과세 대상은 세액공제를 받은 납입액과 운용수익입니다. 여기서는 잔액 전체를 과세 대상으로 단순 가정하므로, 세액공제를 받지 않은 납입원금이 있으면 실제 세금은 더 적을 수 있습니다."
        )}
      </p>
    </section>
  );
}

function Metric({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="rounded-xl border border-border p-3 dark:border-border-dark">
      <p className="text-[11px] text-gray-400 dark:text-gray-500">{label}</p>
      <p
        className={`mt-0.5 truncate text-sm font-bold [font-variant-numeric:tabular-nums] ${
          strong ? "text-gray-900 dark:text-gray-100" : "text-gray-700 dark:text-gray-300"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
