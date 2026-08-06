"use client";

import { OwnerFilter } from "@/lib/models/asset-owner";
import { RETURN_PRESETS } from "@/lib/models/retirement";
import type { SavingsPace } from "@/lib/services/retirement-service";
import MoneyInput from "@/components/common/MoneyInput";
import { useDisplayCurrency } from "@/lib/currency-context";
import { useSettings } from "@/lib/settings-context";
import { useT } from "@/lib/i18n/locale-context";

const inputClass =
  "rounded-xl bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-300 focus:ring-2 focus:ring-gray-900/10 dark:bg-white/5 dark:text-gray-100 dark:placeholder:text-gray-600 dark:focus:ring-white/10";
const labelClass = "flex flex-col gap-1.5";
const labelTextClass = "text-xs font-medium text-gray-500 dark:text-gray-400";

/**
 * The retirement plan's inputs. Money is entered in KRW (like the 세금 page)
 * and always in **today's money** — the projection handles inflation — so the
 * user never has to imagine future prices. Everything persists per scope via
 * the settings context, debounced.
 */
export default function RetirementInputsCard({
  scope,
  detectedPace,
}: {
  scope: OwnerFilter;
  detectedPace: SavingsPace | null;
}) {
  const { money } = useDisplayCurrency();
  const { retirementInputs, updateRetirementInputs } = useSettings();
  const t = useT();
  const inputs = retirementInputs(scope);

  const set = (patch: Parameters<typeof updateRetirementInputs>[1]) =>
    updateRetirementInputs(scope, patch);

  const numberValue = (value: number) => (value ? String(value) : "");

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-card-dark">
      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t("나의 계획")}</p>
      <p className="mt-0.5 text-[11px] leading-relaxed text-gray-400 dark:text-gray-500">
        {t(
          "금액은 모두 오늘 물가 기준으로 입력하세요 — 물가상승은 계산에서 알아서 반영합니다. 입력값은 자동 저장됩니다."
        )}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <label className={labelClass}>
          <span className={labelTextClass}>{t("출생연도")}</span>
          <input
            type="number"
            inputMode="numeric"
            value={numberValue(inputs.birthYear)}
            onChange={(e) => set({ birthYear: Number(e.target.value) || 0 })}
            placeholder={t("예: 1980")}
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          <span className={labelTextClass}>{t("은퇴 목표 나이")}</span>
          <input
            type="number"
            inputMode="numeric"
            value={numberValue(inputs.retirementAge)}
            onChange={(e) => set({ retirementAge: Number(e.target.value) || 0 })}
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          <span className={labelTextClass}>{t("은퇴 후 월 생활비")}</span>
          <MoneyInput
            value={numberValue(inputs.monthlyExpenseKrw)}
            onChange={(raw) => set({ monthlyExpenseKrw: Number(raw) || 0 })}
            currency="KRW"
            placeholder="0"
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          <span className={labelTextClass}>{t("기타 월 수입 (국민연금 등)")}</span>
          <MoneyInput
            value={numberValue(inputs.otherMonthlyIncomeKrw)}
            onChange={(raw) => set({ otherMonthlyIncomeKrw: Number(raw) || 0 })}
            currency="KRW"
            placeholder="0"
            className={inputClass}
          />
        </label>
      </div>

      {/* Return + inflation */}
      <div className="mt-4 flex flex-col gap-1.5">
        <span className={labelTextClass}>{t("기대 수익률 (연, 세전)")}</span>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1 rounded-lg bg-gray-50 p-0.5 dark:bg-white/5">
            {RETURN_PRESETS.map((preset) => (
              <button
                key={preset.pct}
                type="button"
                onClick={() => set({ expectedReturnPct: preset.pct })}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  inputs.expectedReturnPct === preset.pct
                    ? "bg-white text-gray-900 shadow-sm dark:bg-white/15 dark:text-gray-100"
                    : "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                }`}
              >
                {t(preset.label)} {preset.pct}%
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <input
              type="number"
              inputMode="decimal"
              step="0.5"
              value={numberValue(inputs.expectedReturnPct)}
              onChange={(e) => set({ expectedReturnPct: Number(e.target.value) || 0 })}
              className={`w-20 text-right ${inputClass}`}
              aria-label={t("기대 수익률 (연, 세전)")}
            />
            <span className="text-xs text-gray-400 dark:text-gray-500">%</span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <span className="w-24 shrink-0 text-xs font-medium text-gray-500 dark:text-gray-400">
          {t("물가상승률 (연)")}
        </span>
        <input
          type="number"
          inputMode="decimal"
          step="0.1"
          value={numberValue(inputs.inflationPct)}
          onChange={(e) => set({ inflationPct: Number(e.target.value) || 0 })}
          className={`w-20 text-right ${inputClass}`}
          aria-label={t("물가상승률 (연)")}
        />
        <span className="text-xs text-gray-400 dark:text-gray-500">%</span>
      </div>

      {/* Life expectancy */}
      <div className="mt-4 flex items-center gap-3">
        <span className="w-24 shrink-0 text-xs font-medium text-gray-500 dark:text-gray-400">
          {t("기대 수명")}
        </span>
        <input
          type="number"
          inputMode="numeric"
          value={numberValue(inputs.lifeExpectancy)}
          onChange={(e) => set({ lifeExpectancy: Number(e.target.value) || 0 })}
          className={`w-20 text-right ${inputClass}`}
          aria-label={t("기대 수명")}
        />
        <span className="text-xs text-gray-400 dark:text-gray-500">{t("세")}</span>
      </div>

      {/* Saving pace */}
      <div className="mt-5 rounded-xl bg-gray-50 p-4 dark:bg-white/5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            {t("월 저축액")}
          </span>
          <label className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
            <input
              type="checkbox"
              checked={inputs.useDetectedSaving}
              onChange={(e) => set({ useDetectedSaving: e.target.checked })}
              className="h-3.5 w-3.5 cursor-pointer rounded border-gray-300 text-gray-900 focus:ring-gray-900/20 dark:border-gray-600 dark:text-white"
            />
            {t("자동 감지 사용")}
          </label>
        </div>

        {inputs.useDetectedSaving ? (
          <p className="mt-2 text-sm font-bold text-gray-900 [font-variant-numeric:tabular-nums] dark:text-gray-100">
            {detectedPace
              ? money(detectedPace.monthlyMedianKrw)
              : t("기록이 부족해 감지할 수 없어요")}
            {detectedPace && (
              <span className="ml-2 text-[11px] font-normal text-gray-400 dark:text-gray-500">
                {t("최근 {n}개월 원금 증가 기준", { n: detectedPace.samples })}
              </span>
            )}
          </p>
        ) : (
          <div className="mt-2">
            <MoneyInput
              value={numberValue(inputs.monthlySavingKrw)}
              onChange={(raw) => set({ monthlySavingKrw: Number(raw) || 0 })}
              currency="KRW"
              placeholder="0"
              className={`max-w-[12rem] ${inputClass}`}
            />
          </div>
        )}

        {inputs.useDetectedSaving && detectedPace?.noisy && (
          <p className="mt-2 text-[11px] leading-relaxed text-gray-400 dark:text-gray-500">
            {t(
              "원금 이력에 큰 변동(자산 뒤늦은 등록·평단가 수정 등)이 섞여 있어요. 중앙값으로 계산했지만, 실제 저축 페이스와 다르면 자동 감지를 끄고 직접 입력하세요."
            )}
          </p>
        )}
      </div>
    </section>
  );
}
