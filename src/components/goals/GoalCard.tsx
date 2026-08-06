"use client";

import { useState } from "react";
import { AlertTriangle, Check, ChevronDown, Pencil } from "lucide-react";
import { Asset } from "@/lib/models/asset";
import { Goal, goalIdForAsset } from "@/lib/models/goal";
import { getAssetCategoryLabel } from "@/lib/models/portfolio-category";
import type { GoalProgress } from "@/lib/services/goal-service";
import { getAssetMetrics } from "@/lib/services/portfolio-service";
import { useDisplayCurrency } from "@/lib/currency-context";
import { useT } from "@/lib/i18n/locale-context";

const GOOD = "#1baf7a";
const WARN = "#c98500";
const BAD = "#F04452";
const NEUTRAL = "#3182F6";

export default function GoalCard({
  progress,
  goals,
  assets,
  onEdit,
  onToggleAsset,
}: {
  progress: GoalProgress;
  goals: Goal[];
  assets: Asset[];
  onEdit: () => void;
  onToggleAsset: (assetId: string, assign: boolean) => void;
}) {
  const { usdKrw, money } = useDisplayCurrency();
  const t = useT();
  const [expanded, setExpanded] = useState(false);

  const { goal, complete, pastDue, nearTermEquityRisk } = progress;
  const barColor = complete ? GOOD : pastDue ? BAD : nearTermEquityRisk ? WARN : NEUTRAL;
  const pct = Math.round(progress.progressRatio * 100);

  const deadlineChip =
    progress.daysRemaining < 0
      ? { text: t("기한 지남"), color: BAD }
      : progress.daysRemaining <= 60
        ? { text: t("D-{days}", { days: progress.daysRemaining }), color: WARN }
        : { text: t("약 {months}개월 남음", { months: Math.round(progress.monthsRemaining) }), color: "#8a95a3" };

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-card-dark">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-bold text-gray-900 dark:text-gray-100">{goal.name}</h3>
            <span
              className="shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
              style={{ color: deadlineChip.color, backgroundColor: `${deadlineChip.color}1f` }}
            >
              {deadlineChip.text}
            </span>
            {complete && (
              <span
                className="flex shrink-0 items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
                style={{ color: GOOD, backgroundColor: `${GOOD}1f` }}
              >
                <Check size={11} /> {t("달성")}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
            {goal.targetDate} · {t("목표 {value}", { value: money(goal.targetAmountKrw) })}
          </p>
        </div>
        <button
          type="button"
          onClick={onEdit}
          aria-label={t("목표 수정")}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10"
        >
          <Pencil size={15} />
        </button>
      </div>

      {/* Progress */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-gray-500 dark:text-gray-400">
            {t("배정 {value}", { value: money(progress.assignedKrw) })}
          </span>
          <span className="font-bold [font-variant-numeric:tabular-nums]" style={{ color: barColor }}>
            {pct}%
          </span>
        </div>
        <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
          <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, pct)}%`, backgroundColor: barColor }} />
        </div>
      </div>

      {/* Numbers */}
      {!complete && (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border p-3 dark:border-border-dark">
            <p className="text-[11px] text-gray-400 dark:text-gray-500">{t("남은 금액")}</p>
            <p className="mt-0.5 truncate text-sm font-bold text-gray-900 [font-variant-numeric:tabular-nums] dark:text-gray-100">
              {money(progress.remainingKrw)}
            </p>
          </div>
          <div className="rounded-xl border border-border p-3 dark:border-border-dark">
            <p className="text-[11px] text-gray-400 dark:text-gray-500">{t("필요 월 저축")}</p>
            <p className="mt-0.5 truncate text-sm font-bold text-gray-900 [font-variant-numeric:tabular-nums] dark:text-gray-100">
              {progress.requiredMonthlyKrw !== null
                ? money(progress.requiredMonthlyKrw)
                : pastDue
                  ? t("기한 경과")
                  : t("지금 필요")}
            </p>
          </div>
        </div>
      )}

      {/* Warnings */}
      {nearTermEquityRisk && (
        <div className="mt-3 flex items-start gap-2 rounded-xl px-3 py-2.5 text-[11px] leading-relaxed" style={{ backgroundColor: `${WARN}14`, color: WARN }}>
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span>
            {t("{months}개월 뒤 쓸 돈인데 배정 자산의 {ratio}%가 주식이에요 — 하락장에 대비해 안전자산 비중을 늘리는 걸 검토하세요.", {
              months: Math.max(0, Math.round(progress.monthsRemaining)),
              ratio: Math.round(progress.stockRatio * 100),
            })}
          </span>
        </div>
      )}
      {pastDue && (
        <p className="mt-3 text-[11px] font-medium" style={{ color: BAD }}>
          {t("목표 시점이 지났지만 아직 {value} 부족합니다.", { value: money(progress.remainingKrw) })}
        </p>
      )}
      {progress.missingAssetIds.length > 0 && (
        <p className="mt-2 text-[11px] text-gray-400 dark:text-gray-500">
          {t("삭제된 자산 {count}개가 배정 목록에 남아 있어요 — 다시 배정하면 정리됩니다.", {
            count: progress.missingAssetIds.length,
          })}
        </p>
      )}

      {/* Assignment */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="mt-4 flex items-center gap-1 text-xs font-medium text-gray-400 transition-colors hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
      >
        <ChevronDown size={14} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
        {t("자산 배정 ({count}개)", { count: goal.assetIds.length })}
      </button>

      {expanded && (
        <div className="mt-2 flex flex-col gap-1 rounded-xl border border-border p-2 dark:border-border-dark">
          {assets.length === 0 ? (
            <p className="px-2 py-3 text-center text-xs text-gray-400 dark:text-gray-500">{t("배정할 자산이 없어요.")}</p>
          ) : (
            assets.map((asset) => {
              const owningGoalId = goalIdForAsset(goals, asset.id);
              const assignedHere = owningGoalId === goal.id;
              const otherGoal = owningGoalId && !assignedHere ? goals.find((g) => g.id === owningGoalId) : null;
              const valuation = getAssetMetrics(asset, usdKrw).valuation;
              return (
                <label
                  key={asset.id}
                  className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-gray-50 dark:hover:bg-white/5"
                >
                  <input
                    type="checkbox"
                    checked={assignedHere}
                    onChange={(e) => onToggleAsset(asset.id, e.target.checked)}
                    className="h-4 w-4 shrink-0 cursor-pointer rounded border-gray-300 text-gray-900 focus:ring-gray-900/20 dark:border-gray-600 dark:text-white"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-medium text-gray-800 dark:text-gray-200">{asset.name}</span>
                    <span className="block truncate text-[10px] text-gray-400 dark:text-gray-500">
                      {getAssetCategoryLabel(asset)}
                      {otherGoal && ` · ${t("현재 '{name}'에 배정됨", { name: otherGoal.name })}`}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs text-gray-500 [font-variant-numeric:tabular-nums] dark:text-gray-400">
                    {money(valuation)}
                  </span>
                </label>
              );
            })
          )}
        </div>
      )}
    </section>
  );
}
