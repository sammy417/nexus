"use client";

import { FormEvent, useState } from "react";
import { X } from "lucide-react";
import { AssetOwner, Currency } from "@/lib/models/asset";
import { ASSET_OWNERS } from "@/lib/models/asset-owner";
import { DividendInput } from "@/lib/models/dividend";
import { usePortfolio } from "@/lib/portfolio-context";
import { useSettings } from "@/lib/settings-context";
import { useT } from "@/lib/i18n/locale-context";
import MoneyInput from "@/components/common/MoneyInput";

const inputClass =
  "rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-300 focus:ring-2 focus:ring-gray-900/10 dark:bg-white/5 dark:text-gray-100 dark:placeholder:text-gray-600 dark:focus:ring-white/10";
const labelClass = "flex flex-col gap-1.5";
const labelTextClass = "text-xs font-medium text-gray-500 dark:text-gray-400";

/** Default name for a lump-sum entry (identifies it in the list/README). */
const LUMP_SUM_NAME = "배당 합계 (일괄 입력)";

type Mode = "SINGLE" | "LUMP";

export default function DividendFormDialog({
  onSubmit,
  onClose,
}: {
  onSubmit: (input: DividendInput) => Promise<void>;
  onClose: () => void;
}) {
  const { assets } = usePortfolio();
  const { ownerName, ownerColor } = useSettings();
  const t = useT();
  const [mode, setMode] = useState<Mode>("SINGLE");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<Currency>("KRW");
  const [owner, setOwner] = useState<AssetOwner>("SELF");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [memo, setMemo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Lump-sum mode: one record covering a whole period, no specific security.
  const [periodLabel, setPeriodLabel] = useState(String(new Date().getUTCFullYear()));

  const nameSuggestions = [
    ...new Set(
      assets
        .filter((asset) => asset.type === "STOCK" || asset.type === "BOND")
        .map((asset) => asset.name)
    ),
  ];

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const isLump = mode === "LUMP";
    // Lump-sum entries don't name a security; the period label identifies them.
    const trimmedName = isLump
      ? `${t(LUMP_SUM_NAME)}${periodLabel.trim() ? ` · ${periodLabel.trim()}` : ""}`
      : name.trim();
    const value = Number(amount);
    if (!isLump && !trimmedName) {
      setError(t("종목/이름을 입력해 주세요."));
      return;
    }
    if (!Number.isFinite(value) || value <= 0) {
      setError(t("금액을 올바르게 입력해 주세요."));
      return;
    }
    if (!date) {
      setError(t("지급일을 선택해 주세요."));
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: trimmedName,
        amount: value,
        currency,
        owner,
        date,
        memo: memo.trim() || (isLump ? t("여러 종목 합산") : undefined),
      });
      onClose();
    } catch (err) {
      const detail = err instanceof Error && err.message ? ` (${err.message})` : "";
      setError(t("저장에 실패했습니다. 잠시 후 다시 시도해 주세요.") + detail);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <button type="button" aria-label={t("닫기")} onClick={onClose} className="absolute inset-0 bg-black/40" />
      <div className="relative w-full max-w-md rounded-2xl bg-white px-6 pb-6 pt-5 shadow-xl dark:bg-card-dark">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {mode === "LUMP" ? t("배당 합계 기록") : t("배당 기록 추가")}
          </h2>
          <button
            type="button"
            aria-label={t("닫기")}
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
          {/* Mode: one security at a time, or one lump sum for many */}
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-gray-50 p-0.5 dark:bg-white/5">
            {(
              [
                { value: "SINGLE" as const, label: "종목별 입력" },
                { value: "LUMP" as const, label: "전체 한번에" },
              ]
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setMode(option.value)}
                className={`rounded-md px-3 py-2 text-xs font-semibold transition-colors ${
                  mode === option.value
                    ? "bg-white text-gray-900 shadow-sm dark:bg-white/15 dark:text-gray-100"
                    : "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                }`}
              >
                {t(option.label)}
              </button>
            ))}
          </div>

          {mode === "SINGLE" ? (
            <label className={labelClass}>
              <span className={labelTextClass}>{t("종목/이름")}</span>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={t("예: 삼성전자")}
                list="dividend-name-suggestions"
                required
                className={inputClass}
              />
              <datalist id="dividend-name-suggestions">
                {nameSuggestions.map((suggestion) => (
                  <option key={suggestion} value={suggestion} />
                ))}
              </datalist>
            </label>
          ) : (
            <>
              <p className="rounded-xl bg-gray-50 px-4 py-3 text-[11px] leading-relaxed text-gray-500 dark:bg-white/5 dark:text-gray-400">
                {t(
                  "종목을 하나씩 찾아 넣는 대신, 받은 배당을 모두 더한 금액을 한 건으로 기록합니다. 통계·차트·세금 계산에는 똑같이 반영되고, 종목별 상세만 남지 않습니다."
                )}
              </p>
              <label className={labelClass}>
                <span className={labelTextClass}>{t("기간 표시 (선택)")}</span>
                <input
                  type="text"
                  value={periodLabel}
                  onChange={(event) => setPeriodLabel(event.target.value)}
                  placeholder={t("예: 2026, 2026 상반기")}
                  className={inputClass}
                />
              </label>
            </>
          )}

          <div className="grid grid-cols-[1fr_auto] items-end gap-3">
            <label className={labelClass}>
              <span className={labelTextClass}>
                {mode === "LUMP" ? t("합계 금액 (세후)") : t("금액 (세후)")}
              </span>
              <MoneyInput
                value={amount}
                onChange={setAmount}
                currency={currency}
                placeholder="0"
                required
                className={inputClass}
              />
            </label>
            <div className="flex gap-1 rounded-lg bg-gray-50 p-0.5 dark:bg-white/5">
              {(["KRW", "USD"] as Currency[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCurrency(c)}
                  className={`rounded-md px-3 py-2 text-xs font-semibold transition-colors ${
                    currency === c
                      ? "bg-white text-gray-900 shadow-sm dark:bg-white/15 dark:text-gray-100"
                      : "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                  }`}
                >
                  {c === "KRW" ? "₩" : "$"}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className={labelTextClass}>{t("소유자")}</span>
            <div className="flex gap-1 rounded-lg bg-gray-50 p-0.5 dark:bg-white/5">
              {ASSET_OWNERS.map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => setOwner(o)}
                  className={`flex items-center gap-1 rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                    owner === o
                      ? "bg-white text-gray-900 shadow-sm dark:bg-white/15 dark:text-gray-100"
                      : "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                  }`}
                >
                  <span
                    aria-hidden
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: ownerColor(o) }}
                  />
                  {ownerName(o)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className={labelClass}>
              <span className={labelTextClass}>
                {mode === "LUMP" ? t("기준일") : t("지급일")}
              </span>
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                required
                className={`${inputClass} [color-scheme:light] dark:[color-scheme:dark]`}
              />
            </label>
            <label className={labelClass}>
              <span className={labelTextClass}>{t("메모 (선택)")}</span>
              <input
                type="text"
                value={memo}
                onChange={(event) => setMemo(event.target.value)}
                placeholder={t("예: 분기 배당")}
                className={inputClass}
              />
            </label>
          </div>

          {error && <p className="text-xs font-medium text-fall">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl bg-gray-900 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:opacity-60 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
          >
            {t("추가하기")}
          </button>
        </form>
      </div>
    </div>
  );
}
