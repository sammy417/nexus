"use client";

import { useState } from "react";
import { Check, Scale } from "lucide-react";
import { Asset } from "@/lib/models/asset";
import {
  PORTFOLIO_CATEGORY_COLOR,
  PORTFOLIO_CATEGORY_LABEL,
} from "@/lib/models/portfolio-category";
import { hexWithAlpha } from "@/lib/models/asset-owner";
import MoneyInput from "@/components/common/MoneyInput";
import { useDisplayCurrency } from "@/lib/currency-context";
import { useSettings } from "@/lib/settings-context";
import { useT } from "@/lib/i18n/locale-context";
import {
  getContributionPlan,
  getRebalancePlan,
  type RebalanceRow,
} from "@/lib/services/rebalance-service";

/** Attention tone for a sleeve that has drifted outside its band. */
const ALERT = "#c98500";

const inputClass =
  "rounded-xl bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-300 focus:ring-2 focus:ring-gray-900/10 dark:bg-white/5 dark:text-gray-100 dark:placeholder:text-gray-600 dark:focus:ring-white/10";

function signedPp(value: number): string {
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}%p`;
}

/**
 * Current vs target allocation, and the trades that would close the gap.
 * Hidden when the user turned targets off in settings.
 */
export default function RebalanceCard({
  assets,
  className = "",
}: {
  assets: Asset[];
  className?: string;
}) {
  const { usdKrw, money } = useDisplayCurrency();
  const { targetAllocation } = useSettings();
  const t = useT();
  const [newCash, setNewCash] = useState("");

  if (!targetAllocation.enabled) return null;

  const plan = getRebalancePlan(assets, usdKrw, targetAllocation);
  if (plan.totalValuation <= 0) return null;

  // Shared scale so small sleeves stay visible next to big ones. The 5%
  // headroom keeps the largest target marker off the clipped track edge.
  const scaleMax =
    Math.max(...plan.rows.map((row) => Math.max(row.currentRatio, row.targetRatio)), 1) * 1.05;
  const actionable = plan.rows.filter((row) => row.outOfBand);
  const cashAmount = Number(newCash);
  const contributions =
    Number.isFinite(cashAmount) && cashAmount > 0 ? getContributionPlan(plan, cashAmount) : [];

  return (
    <section
      className={`flex flex-col rounded-2xl bg-white p-6 shadow-sm dark:bg-card-dark ${className}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {t("목표 배분 · 리밸런싱")}
          </p>
          <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
            {t("최대 이탈 {drift} · 허용 ±{band}%p", {
              drift: `${plan.maxAbsDrift.toFixed(1)}%p`,
              band: targetAllocation.bandPct,
            })}
          </p>
        </div>
        <span
          className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold"
          style={
            plan.needsRebalancing
              ? { color: ALERT, backgroundColor: hexWithAlpha(ALERT, 0.12) }
              : { color: "#1baf7a", backgroundColor: hexWithAlpha("#1baf7a", 0.12) }
          }
        >
          {plan.needsRebalancing ? (
            <>
              <Scale size={12} />
              {t("리밸런싱 필요 {count}개", { count: actionable.length })}
            </>
          ) : (
            <>
              <Check size={12} />
              {t("목표 범위 내")}
            </>
          )}
        </span>
      </div>

      {/* Per-sleeve drift */}
      <ul className="mt-4 flex flex-col gap-2.5">
        {plan.rows.map((row) => (
          <DriftRow key={row.category} row={row} scaleMax={scaleMax} money={money} t={t} />
        ))}
      </ul>

      {/* Trades that close the gap */}
      {actionable.length > 0 && (
        <div className="mt-5 border-t border-border pt-4 dark:border-border-dark">
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            {t("목표를 맞추려면")}
          </p>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
            {actionable.map((row) => {
              const isBuy = row.deltaValuation > 0;
              return (
                <li key={row.category} className="text-xs">
                  <span className="text-gray-500 dark:text-gray-400">
                    {t(PORTFOLIO_CATEGORY_LABEL[row.category])}{" "}
                  </span>
                  <span className={`font-semibold ${isBuy ? "text-rise" : "text-fall"}`}>
                    {money(Math.abs(row.deltaValuation))} {isBuy ? t("매수") : t("매도")}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Cash-flow rebalancing: buy-only, no realized gains */}
      <div className="mt-5 border-t border-border pt-4 dark:border-border-dark">
        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
          {t("새 자금으로만 맞추기")}
        </p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-gray-400 dark:text-gray-500">
          {t("매도 없이 추가 투자금만으로 비중을 조정하는 방법입니다 (세금·거래비용 절약).")}
        </p>
        <div className="mt-2.5 max-w-xs">
          <MoneyInput
            value={newCash}
            onChange={setNewCash}
            currency="KRW"
            placeholder={t("추가 투자금 입력")}
            className={inputClass}
          />
        </div>
        {contributions.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
            {contributions.map((entry) => (
              <li key={entry.category} className="text-xs">
                <span className="text-gray-500 dark:text-gray-400">
                  {t(PORTFOLIO_CATEGORY_LABEL[entry.category])}{" "}
                </span>
                <span className="font-semibold text-rise">{money(entry.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {plan.excludedHomeValuation > 0 && (
        <p className="mt-4 text-[11px] text-gray-400 dark:text-gray-500">
          {t("실거주 주택(집) {amount}은(는) 계산에서 제외했습니다.", {
            amount: money(plan.excludedHomeValuation),
          })}
        </p>
      )}
    </section>
  );
}

function DriftRow({
  row,
  scaleMax,
  money,
  t,
}: {
  row: RebalanceRow;
  scaleMax: number;
  money: (krw: number) => string;
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  const color = PORTFOLIO_CATEGORY_COLOR[row.category];
  const currentWidth = (row.currentRatio / scaleMax) * 100;
  const targetLeft = (row.targetRatio / scaleMax) * 100;

  return (
    <li className="flex items-center gap-3 text-sm">
      <span
        aria-hidden
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span className="w-14 shrink-0 text-xs font-medium text-gray-700 dark:text-gray-300">
        {t(PORTFOLIO_CATEGORY_LABEL[row.category])}
      </span>

      <div
        className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-white/5"
        role="img"
        aria-label={t("{category} 현재 {current}%, 목표 {target}%", {
          category: t(PORTFOLIO_CATEGORY_LABEL[row.category]),
          current: row.currentRatio.toFixed(1),
          target: row.targetRatio.toFixed(1),
        })}
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.min(100, currentWidth)}%`, backgroundColor: color }}
        />
        {/* Target marker */}
        <span
          aria-hidden
          className="absolute top-0 h-full w-0.5 bg-gray-900 dark:bg-white"
          style={{ left: `calc(${Math.min(100, targetLeft)}% - 1px)` }}
        />
      </div>

      <span className="w-11 shrink-0 text-right text-xs font-semibold text-gray-900 [font-variant-numeric:tabular-nums] dark:text-gray-100">
        {row.currentRatio.toFixed(1)}%
      </span>
      <span className="hidden w-11 shrink-0 text-right text-[11px] text-gray-400 [font-variant-numeric:tabular-nums] sm:block dark:text-gray-500">
        {row.targetRatio.toFixed(0)}%
      </span>
      <span
        className="w-14 shrink-0 text-right text-[11px] font-medium [font-variant-numeric:tabular-nums]"
        style={row.outOfBand ? { color: ALERT } : undefined}
      >
        <span className={row.outOfBand ? "" : "text-gray-400 dark:text-gray-500"}>
          {signedPp(row.driftPct)}
        </span>
      </span>
      <span className="hidden w-28 shrink-0 text-right text-[11px] text-gray-400 lg:block dark:text-gray-500">
        {money(row.currentValuation)}
      </span>
    </li>
  );
}
