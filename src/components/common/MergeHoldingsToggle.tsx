"use client";

import { useT } from "@/lib/i18n/locale-context";

/** "같은 종목 합산" toggle button, shared by the portfolio and stock menus. */
export default function MergeHoldingsToggle({
  active,
  onToggle,
}: {
  active: boolean;
  onToggle: () => void;
}) {
  const t = useT();
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
          : "bg-gray-50 text-gray-400 hover:text-gray-600 dark:bg-white/5 dark:text-gray-500 dark:hover:text-gray-300"
      }`}
    >
      {t("같은 종목 합산")}
    </button>
  );
}
