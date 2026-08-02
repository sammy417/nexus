"use client";

import { DIVIDEND_TAX_RATE, DividendRecord } from "@/lib/models/dividend";
import { getFinancialIncomeSummary } from "@/lib/services/tax-service";
import { useDisplayCurrency } from "@/lib/currency-context";
import { useT } from "@/lib/i18n/locale-context";

const OVER_COLOR = "#F04452";
const UNDER_COLOR = "#1baf7a";

/** 올해 배당·이자소득 합계가 금융소득종합과세 기준금액에 얼마나 가까운지 보여준다. */
export default function FinancialIncomeCard({ records }: { records: DividendRecord[] }) {
  const { usdKrw, money } = useDisplayCurrency();
  const t = useT();

  const summary = getFinancialIncomeSummary(records, usdKrw);
  const barPct = Math.min(100, summary.ratio);
  const color = summary.overThreshold ? OVER_COLOR : UNDER_COLOR;

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-card-dark">
      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
        {t("금융소득종합과세 트래커")}
      </p>
      <p className="mt-0.5 text-[11px] leading-relaxed text-gray-400 dark:text-gray-500">
        {t(
          "올해 기록된 배당·이자 합계가 기준금액을 넘으면 초과분이 다른 소득과 합산되어 종합과세됩니다(기준 이하는 {rate}% 원천징수로 종결).",
          { rate: (DIVIDEND_TAX_RATE * 100).toFixed(1) }
        )}
      </p>

      <div className="mt-4 flex items-baseline justify-between">
        <p className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          {money(summary.thisYearIncomeKrw)}
        </p>
        <p className="text-xs font-medium text-gray-400 dark:text-gray-500">
          {t("기준 {threshold}", { threshold: money(summary.thresholdKrw) })}
        </p>
      </div>

      <div className="mt-2.5 h-2.5 overflow-hidden rounded-full bg-gray-100 dark:bg-white/5">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${Math.max(barPct, summary.thisYearIncomeKrw > 0 ? 2 : 0)}%`, backgroundColor: color }}
        />
      </div>

      {summary.overThreshold ? (
        <p className="mt-3 rounded-xl bg-fall/10 px-3 py-2 text-[11px] font-medium text-fall">
          {t("기준금액을 {excess} 초과했습니다 — 초과분은 다음 해 5월 종합소득세 신고 대상입니다.", {
            excess: money(summary.excessKrw),
          })}
        </p>
      ) : (
        <p className="mt-3 text-[11px] text-gray-400 dark:text-gray-500">
          {t("기준금액까지 {remaining} 남았습니다.", {
            remaining: money(summary.thresholdKrw - summary.thisYearIncomeKrw),
          })}
        </p>
      )}
    </section>
  );
}
