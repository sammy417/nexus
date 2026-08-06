"use client";

import { ArrowDownCircle, CalendarClock, PiggyBank, TrendingUp } from "lucide-react";
import { RetirementInputs } from "@/lib/models/retirement";
import type { RetirementProjection } from "@/lib/services/retirement-service";
import { useDisplayCurrency } from "@/lib/currency-context";
import { useT } from "@/lib/i18n/locale-context";

const GOOD = "#1baf7a";
const WARN = "#c98500";
const BAD = "#F04452";

/**
 * The headline answer: how long the money lasts, how close the plan is to
 * fully funded, and — when it falls short — the three levers that would close
 * the gap. Everything shown is in today's money (실질); the future's nominal
 * won appears only as a secondary line so purchasing power stays legible.
 */
export default function RetirementSummary({
  projection,
  inputs,
}: {
  projection: RetirementProjection;
  inputs: RetirementInputs;
}) {
  const { money } = useDisplayCurrency();
  const t = useT();

  const { depletionAge, prescription } = projection;
  const sustainable = depletionAge === null || depletionAge >= inputs.lifeExpectancy;
  const ratioPct = Number.isFinite(projection.achievementRatio)
    ? Math.round(projection.achievementRatio * 100)
    : 100;
  const gaugeColor = sustainable ? GOOD : ratioPct >= 70 ? WARN : BAD;

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-card-dark">
      {/* Headline: the age the money lasts to. */}
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: `${gaugeColor}1f`, color: gaugeColor }}
        >
          <CalendarClock size={18} />
        </span>
        <div>
          {depletionAge === null ? (
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {t("자산이 은퇴 기간 내내 유지됩니다")}
            </p>
          ) : sustainable ? (
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {t("자산이 약 {age}세까지 버팁니다", { age: Math.floor(depletionAge) })}
            </p>
          ) : (
            <p className="text-lg font-bold" style={{ color: BAD }}>
              {t("자산이 약 {age}세에 바닥납니다", { age: Math.floor(depletionAge) })}
            </p>
          )}
          <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
            {t("목표: {retire}세 은퇴 · {life}세까지 대비", {
              retire: inputs.retirementAge,
              life: inputs.lifeExpectancy,
            })}
          </p>
        </div>
      </div>

      {/* Achievement gauge. */}
      <div className="mt-5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-gray-500 dark:text-gray-400">{t("목표 달성률")}</span>
          <span className="font-bold [font-variant-numeric:tabular-nums]" style={{ color: gaugeColor }}>
            {Number.isFinite(projection.achievementRatio) ? `${ratioPct}%` : t("충분")}
          </span>
        </div>
        <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${Math.min(100, ratioPct)}%`, backgroundColor: gaugeColor }}
          />
        </div>
      </div>

      {/* Real (today's money) figures — the honest basis. */}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <Figure
          label={t("은퇴 시점 예상 자산")}
          value={money(projection.base.retirementAssetsRealKrw)}
          sub={t("명목 {value}", { value: money(projection.base.retirementAssetsNominalKrw) })}
        />
        <Figure
          label={t("필요 자산")}
          value={money(projection.neededRealKrw)}
          sub={
            projection.surplusRealKrw >= 0
              ? t("여유 {value}", { value: money(projection.surplusRealKrw) })
              : t("부족 {value}", { value: money(-projection.surplusRealKrw) })
          }
          subColor={projection.surplusRealKrw >= 0 ? GOOD : BAD}
        />
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-gray-400 dark:text-gray-500">
        {t("금액은 오늘 물가 기준(실질)입니다. 실제 세액·수익률·물가는 가정과 다를 수 있는 추정치예요.")}
      </p>

      {/* Prescription — only when short. */}
      {!prescription.onTrack && (
        <div className="mt-5">
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            {t("목표에 닿으려면 (하나만 택해도 됩니다)")}
          </p>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Lever
              icon={<PiggyBank size={15} />}
              title={t("더 저축")}
              value={`+${money(prescription.extraMonthlySavingKrw)}`}
              unit={t("/월")}
            />
            <Lever
              icon={<CalendarClock size={15} />}
              title={t("은퇴 늦추기")}
              value={
                prescription.delayYears > 0
                  ? t("+{n}년", { n: prescription.delayYears })
                  : t("어려움")
              }
              unit={prescription.delayYears > 0 ? t("→ {age}세", { age: inputs.retirementAge + prescription.delayYears }) : ""}
            />
            <Lever
              icon={<ArrowDownCircle size={15} />}
              title={t("생활비 줄이기")}
              value={`−${money(prescription.reduceMonthlyExpenseKrw)}`}
              unit={t("/월")}
            />
          </div>
        </div>
      )}

      {prescription.onTrack && (
        <div
          className="mt-5 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium"
          style={{ backgroundColor: `${GOOD}14`, color: GOOD }}
        >
          <TrendingUp size={16} />
          {t("현재 계획이면 목표를 달성합니다.")}
        </div>
      )}
    </section>
  );
}

function Figure({
  label,
  value,
  sub,
  subColor,
}: {
  label: string;
  value: string;
  sub: string;
  subColor?: string;
}) {
  return (
    <div className="rounded-xl border border-border p-3 dark:border-border-dark">
      <p className="text-[11px] text-gray-400 dark:text-gray-500">{label}</p>
      <p className="mt-0.5 truncate text-base font-bold text-gray-900 [font-variant-numeric:tabular-nums] dark:text-gray-100">
        {value}
      </p>
      <p
        className="mt-0.5 truncate text-[11px] font-medium [font-variant-numeric:tabular-nums]"
        style={{ color: subColor ?? "#9ca3af" }}
      >
        {sub}
      </p>
    </div>
  );
}

function Lever({
  icon,
  title,
  value,
  unit,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="rounded-xl bg-gray-50 p-3 dark:bg-white/5">
      <p className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 dark:text-gray-400">
        <span className="text-gray-400 dark:text-gray-500">{icon}</span>
        {title}
      </p>
      <p className="mt-1 text-sm font-bold text-gray-900 [font-variant-numeric:tabular-nums] dark:text-gray-100">
        {value}
        {unit && <span className="ml-1 text-[11px] font-normal text-gray-400 dark:text-gray-500">{unit}</span>}
      </p>
    </div>
  );
}
