"use client";

import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import {
  PORTFOLIO_CATEGORIES,
  PORTFOLIO_CATEGORY_COLOR,
  PORTFOLIO_CATEGORY_LABEL,
  PortfolioCategory,
} from "@/lib/models/portfolio-category";
import {
  ALLOCATION_PRESETS,
  DEFAULT_TARGET_ALLOCATION,
  MAX_BAND_PCT,
  MIN_BAND_PCT,
  matchingPresetId,
  RELATIVE_BAND,
  sumWeights,
  TargetWeights,
} from "@/lib/models/target-allocation";
import { useSettings } from "@/lib/settings-context";
import { useAssetModal } from "@/lib/asset-modal-context";
import { useT } from "@/lib/i18n/locale-context";

const numberInputClass =
  "w-20 shrink-0 rounded-xl bg-gray-50 px-3 py-2 text-right text-sm text-gray-900 outline-none focus:ring-2 focus:ring-gray-900/10 dark:bg-white/5 dark:text-gray-100 dark:focus:ring-white/10";

/**
 * Validity colors for the weight sum. Deliberately not `rise`/`fall` —
 * those are red/blue for Korean market direction, which would read as an
 * error on a perfectly valid 100%.
 */
const VALID_COLOR = "#1baf7a";
const INVALID_COLOR = "#F04452";

/** Pick a target asset allocation (preset or hand-tuned) and its drift band. */
export default function TargetAllocationPanel() {
  const { settings, targetAllocation, save } = useSettings();
  const { showToast } = useAssetModal();
  const t = useT();
  const [enabled, setEnabled] = useState(targetAllocation.enabled);
  const [weights, setWeights] = useState<TargetWeights>(targetAllocation.weights);
  const [bandPct, setBandPct] = useState(targetAllocation.bandPct);
  const [isSaving, setIsSaving] = useState(false);

  // Sync when settings load in after mount.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEnabled(targetAllocation.enabled);
    setWeights(targetAllocation.weights);
    setBandPct(targetAllocation.bandPct);
  }, [targetAllocation]);

  const total = sumWeights(weights);
  const isBalanced = Math.abs(total - 100) < 0.05;
  const activePreset = matchingPresetId(weights);

  async function handleSave() {
    if (!isBalanced) return;
    setIsSaving(true);
    try {
      await save({ ...settings, targetAllocation: { enabled, weights, bandPct } });
      showToast(t("목표 배분이 저장되었습니다."));
    } catch {
      showToast(t("저장에 실패했습니다. 잠시 후 다시 시도해 주세요."));
    } finally {
      setIsSaving(false);
    }
  }

  function setWeight(category: PortfolioCategory, raw: string) {
    const parsed = Number(raw);
    const value = Number.isFinite(parsed) ? Math.min(100, Math.max(0, parsed)) : 0;
    setWeights((prev) => ({ ...prev, [category]: value }));
  }

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-card-dark">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t("목표 자산배분")}</p>
          <p className="mt-1 text-xs leading-relaxed text-gray-400 dark:text-gray-500">
            {t(
              "대시보드의 리밸런싱 카드가 이 목표와 현재 비중을 비교합니다. 아래 프리셋은 일반적인 포트폴리오 구성을 참고한 출발점일 뿐이니, 투자 기간·위험 성향에 맞게 직접 조정하세요."
            )}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label={t("목표 배분 사용")}
          onClick={() => setEnabled((prev) => !prev)}
          className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors ${
            enabled ? "bg-gray-900 dark:bg-white" : "bg-gray-200 dark:bg-white/15"
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform dark:bg-gray-900 ${
              enabled ? "translate-x-[22px]" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      <div className={enabled ? "" : "pointer-events-none mt-2 opacity-40"}>
        {/* Presets */}
        <div className="mt-5 flex flex-wrap gap-2">
          {ALLOCATION_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => setWeights({ ...preset.weights })}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                activePreset === preset.id
                  ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                  : "bg-gray-50 text-gray-500 hover:text-gray-700 dark:bg-white/5 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              {t(preset.label)}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-gray-400 dark:text-gray-500">
          {activePreset
            ? t(ALLOCATION_PRESETS.find((p) => p.id === activePreset)!.summary)
            : t("직접 설정한 배분입니다.")}
        </p>

        {/* Per-category weights */}
        <div className="mt-4 flex flex-col gap-2">
          {PORTFOLIO_CATEGORIES.map((category) => {
            const value = weights[category] ?? 0;
            return (
              <div key={category} className="flex items-center gap-3">
                <span
                  aria-hidden
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: PORTFOLIO_CATEGORY_COLOR[category] }}
                />
                <span className="w-16 shrink-0 text-xs font-medium text-gray-700 dark:text-gray-300">
                  {t(PORTFOLIO_CATEGORY_LABEL[category])}
                </span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={value}
                  aria-label={t("{category} 목표 비중", {
                    category: t(PORTFOLIO_CATEGORY_LABEL[category]),
                  })}
                  onChange={(event) => setWeight(category, event.target.value)}
                  className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-gray-100 accent-gray-900 dark:bg-white/10 dark:accent-white"
                />
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={value}
                  onChange={(event) => setWeight(category, event.target.value)}
                  className={numberInputClass}
                />
                <span className="w-3 shrink-0 text-xs text-gray-400 dark:text-gray-500">%</span>
              </div>
            );
          })}
        </div>

        {/* Sum indicator */}
        <div className="mt-3 flex items-center justify-between rounded-xl bg-gray-50 px-4 py-2.5 dark:bg-white/5">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{t("합계")}</span>
          <span
            className="text-sm font-bold [font-variant-numeric:tabular-nums]"
            style={{ color: isBalanced ? VALID_COLOR : INVALID_COLOR }}
          >
            {total.toFixed(1)}%
            {!isBalanced && (
              <span className="ml-2 text-[11px] font-medium">
                {t("100%가 되도록 {delta}%p 조정하세요", {
                  delta: (100 - total).toFixed(1),
                })}
              </span>
            )}
          </span>
        </div>

        {/* Drift band */}
        <div className="mt-4 flex items-center gap-3">
          <span className="w-16 shrink-0 text-xs font-medium text-gray-700 dark:text-gray-300">
            {t("허용 범위")}
          </span>
          <input
            type="number"
            min={MIN_BAND_PCT}
            max={MAX_BAND_PCT}
            step={0.5}
            value={bandPct}
            aria-label={t("허용 범위")}
            onChange={(event) => {
              const parsed = Number(event.target.value);
              setBandPct(
                Number.isFinite(parsed)
                  ? Math.min(MAX_BAND_PCT, Math.max(MIN_BAND_PCT, parsed))
                  : MIN_BAND_PCT
              );
            }}
            className={numberInputClass}
          />
          <span className="text-xs text-gray-400 dark:text-gray-500">%p</span>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-gray-400 dark:text-gray-500">
          {t(
            "목표에서 이만큼 벗어나면 리밸런싱을 제안합니다. 비중이 작은 자산은 목표의 {relative}%(5/25 규칙)를 함께 적용해 더 엄격하게 판단합니다.",
            { relative: (RELATIVE_BAND * 100).toFixed(0) }
          )}
        </p>
      </div>

      <div className="mt-5 flex items-center gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || !isBalanced}
          className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:opacity-40 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
        >
          {isSaving ? t("저장 중...") : t("저장")}
        </button>
        <button
          type="button"
          aria-label={t("기본값으로 되돌리기")}
          title={t("기본값으로 되돌리기")}
          onClick={() => {
            setWeights({ ...DEFAULT_TARGET_ALLOCATION.weights });
            setBandPct(DEFAULT_TARGET_ALLOCATION.bandPct);
          }}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-white/10"
        >
          <RotateCcw size={16} />
        </button>
      </div>
    </section>
  );
}
