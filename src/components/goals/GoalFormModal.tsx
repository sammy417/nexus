"use client";

import { FormEvent, useState } from "react";
import { Trash2, X } from "lucide-react";
import { Goal } from "@/lib/models/goal";
import MoneyInput from "@/components/common/MoneyInput";
import { useT } from "@/lib/i18n/locale-context";

const inputClass =
  "rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-300 focus:ring-2 focus:ring-gray-900/10 dark:bg-white/5 dark:text-gray-100 dark:placeholder:text-gray-600 dark:focus:ring-white/10";
const labelClass = "flex flex-col gap-1.5";
const labelTextClass = "text-xs font-medium text-gray-500 dark:text-gray-400";

/** Add or edit a goal's name / target amount / target date. Assignment happens on the card. */
export default function GoalFormModal({
  editingGoal,
  onClose,
  onSubmit,
  onDelete,
}: {
  editingGoal: Goal | null;
  onClose: () => void;
  onSubmit: (fields: { name: string; targetAmountKrw: number; targetDate: string }) => void;
  onDelete: (() => void) | null;
}) {
  const t = useT();
  const isEditing = editingGoal !== null;
  const [name, setName] = useState(editingGoal?.name ?? "");
  const [amount, setAmount] = useState(
    editingGoal && editingGoal.targetAmountKrw ? String(editingGoal.targetAmountKrw) : ""
  );
  const [date, setDate] = useState(editingGoal?.targetDate ?? "");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return setError(t("목표 이름을 입력해 주세요."));
    if (!date) return setError(t("목표 시점을 선택해 주세요."));
    const targetAmountKrw = Number(amount) || 0;
    if (targetAmountKrw <= 0) return setError(t("목표 금액을 입력해 주세요."));
    onSubmit({ name: trimmed, targetAmountKrw, targetDate: date });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <button type="button" aria-label={t("닫기")} onClick={onClose} className="absolute inset-0 bg-black/40" />
      <div className="relative w-full max-w-md rounded-2xl bg-white px-6 pb-6 pt-5 shadow-xl dark:bg-card-dark">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {isEditing ? t("목표 수정") : t("목표 추가")}
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
          <label className={labelClass}>
            <span className={labelTextClass}>{t("목표 이름")}</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("예: 전세 보증금, 자녀 학자금")}
              required
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            <span className={labelTextClass}>{t("목표 금액")}</span>
            <MoneyInput
              value={amount}
              onChange={setAmount}
              currency="KRW"
              placeholder="0"
              required
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            <span className={labelTextClass}>{t("목표 시점")}</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className={`${inputClass} [color-scheme:light] dark:[color-scheme:dark]`}
            />
          </label>

          {error && <p className="text-xs font-medium text-fall">{error}</p>}

          <div className="mt-1 flex gap-2">
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                aria-label={t("삭제")}
                className="flex items-center justify-center rounded-xl bg-fall/10 px-4 py-3.5 text-fall transition-colors hover:bg-fall/20"
              >
                <Trash2 size={18} />
              </button>
            )}
            <button
              type="submit"
              className="flex-1 rounded-xl bg-gray-900 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
            >
              {isEditing ? t("수정하기") : t("추가하기")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
