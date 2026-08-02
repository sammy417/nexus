"use client";

import { useState } from "react";
import { Asset } from "@/lib/models/asset";
import {
  PENSION_COMBINED_CREDIT_LIMIT_KRW,
  PENSION_SAVINGS_CREDIT_LIMIT_KRW,
} from "@/lib/models/tax";
import { getPensionCredit } from "@/lib/services/tax-service";
import MoneyInput from "@/components/common/MoneyInput";
import { useDisplayCurrency } from "@/lib/currency-context";
import { useT } from "@/lib/i18n/locale-context";

const inputClass =
  "rounded-xl bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-300 focus:ring-2 focus:ring-gray-900/10 dark:bg-white/5 dark:text-gray-100 dark:placeholder:text-gray-600 dark:focus:ring-white/10";

/**
 * 연금저축·IRP 세액공제 계산기. 현재 데이터 모델은 누적 납입원금만 저장해
 * "올해 납입액"을 자동으로 도출할 수 없어, 사용자가 직접 입력하는 순수
 * 계산기로 둔다(보유 연금 계좌는 참고용으로만 나열).
 */
export default function PensionCreditCard({ pensionAssets }: { pensionAssets: Asset[] }) {
  const { money } = useDisplayCurrency();
  const t = useT();
  const [pensionSavings, setPensionSavings] = useState("");
  const [irp, setIrp] = useState("");
  const [isLowIncome, setIsLowIncome] = useState(true);

  const result = getPensionCredit(Number(pensionSavings) || 0, Number(irp) || 0, isLowIncome);

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-card-dark">
      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
        {t("연금 세액공제 계산기")}
      </p>
      <p className="mt-0.5 text-[11px] leading-relaxed text-gray-400 dark:text-gray-500">
        {t(
          "연금저축은 연 {savingsLimit}, IRP 합산 시 연 {combinedLimit}까지 세액공제 대상입니다. 올해 납입(예정) 금액을 입력해 예상 공제액을 확인하세요.",
          {
            savingsLimit: money(PENSION_SAVINGS_CREDIT_LIMIT_KRW),
            combinedLimit: money(PENSION_COMBINED_CREDIT_LIMIT_KRW),
          }
        )}
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {t("연금저축 올해 납입액")}
          </span>
          <MoneyInput
            value={pensionSavings}
            onChange={setPensionSavings}
            currency="KRW"
            placeholder="0"
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {t("IRP 올해 납입액")}
          </span>
          <MoneyInput
            value={irp}
            onChange={setIrp}
            currency="KRW"
            placeholder="0"
            className={inputClass}
          />
        </label>
      </div>

      <div className="mt-3 flex items-center gap-1 rounded-lg bg-gray-50 p-0.5 dark:bg-white/5">
        {[
          { value: true, label: "총급여 5,500만원(종합소득 4,500만원) 이하" },
          { value: false, label: "초과" },
        ].map((option) => (
          <button
            key={String(option.value)}
            type="button"
            onClick={() => setIsLowIncome(option.value)}
            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              isLowIncome === option.value
                ? "bg-white text-gray-900 shadow-sm dark:bg-white/15 dark:text-gray-100"
                : "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            }`}
          >
            {t(option.label)}
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-2xl bg-gray-50 p-4 dark:bg-white/5">
        <div className="flex items-baseline justify-between">
          <p className="text-xs font-medium text-gray-400 dark:text-gray-500">
            {t("예상 세액공제 ({rate}%)", { rate: (result.creditRate * 100).toFixed(1) })}
          </p>
        </div>
        <p className="mt-1 text-2xl font-bold tracking-tight text-rise">
          {money(result.estimatedCreditKrw)}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3 border-t border-border pt-3 text-xs dark:border-border-dark">
          <div>
            <p className="text-gray-400 dark:text-gray-500">{t("공제 인정 납입액")}</p>
            <p className="mt-0.5 font-semibold text-gray-900 dark:text-gray-100">
              {money(result.eligibleCombinedKrw)}
            </p>
          </div>
          <div>
            <p className="text-gray-400 dark:text-gray-500">{t("한도까지 남은 여력")}</p>
            <p className="mt-0.5 font-semibold text-gray-900 dark:text-gray-100">
              {money(result.remainingRoomKrw)}
            </p>
          </div>
        </div>
      </div>

      {pensionAssets.length > 0 && (
        <p className="mt-3 text-[11px] leading-relaxed text-gray-400 dark:text-gray-500">
          {t("보유 연금 계좌: {names}", {
            names: pensionAssets.map((a) => a.name).join(", "),
          })}
        </p>
      )}
    </section>
  );
}
