"use client";

import { Currency } from "@/lib/models/asset";
import { useDisplayCurrency } from "@/lib/currency-context";
import { useT } from "@/lib/i18n/locale-context";

const OPTIONS: { value: Currency; label: string }[] = [
  { value: "KRW", label: "₩ 원화" },
  { value: "USD", label: "$ 달러" },
];

/** Segmented control switching the display currency for all amounts. */
export default function CurrencyToggle() {
  const { displayCurrency, setDisplayCurrency, usdKrw, isFxLive } = useDisplayCurrency();
  const t = useT();

  return (
    <div className="flex items-center gap-2">
      {displayCurrency === "USD" && (
        <span className="text-[11px] text-gray-400 dark:text-gray-500">
          {isFxLive ? "" : t("환율 조회 실패 · 기본값 ")}
          $1 = ₩{Math.round(usdKrw).toLocaleString("ko-KR")}
        </span>
      )}
      <div className="flex gap-1 rounded-lg bg-gray-50 p-0.5 dark:bg-white/5">
        {OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setDisplayCurrency(value)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              displayCurrency === value
                ? "bg-white text-gray-900 shadow-sm dark:bg-white/15 dark:text-gray-100"
                : "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            }`}
          >
            {t(label)}
          </button>
        ))}
      </div>
    </div>
  );
}
