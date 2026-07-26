"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { ThemeMode, useTheme } from "@/lib/theme-provider";
import { useT } from "@/lib/i18n/locale-context";

const OPTIONS: { mode: ThemeMode; label: string; icon: typeof Sun; desc: string }[] = [
  { mode: "system", label: "시스템", icon: Monitor, desc: "기기 설정을 따라요" },
  { mode: "light", label: "라이트", icon: Sun, desc: "밝은 화면" },
  { mode: "dark", label: "다크", icon: Moon, desc: "눈이 편한 어두운 화면" },
];

/** Light/dark/system appearance selector (system follows the OS live). */
export default function AppearancePanel() {
  const { mode, setMode } = useTheme();
  const t = useT();

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-card-dark">
      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t("화면 테마")}</p>
      <p className="mt-1 text-xs leading-relaxed text-gray-400 dark:text-gray-500">
        {t(
          "밝기 모드를 선택하세요. 어두운 곳에서는 눈이 편한 다크 모드를 권장합니다. ‘시스템’은 기기의 다크 모드 설정을 자동으로 따릅니다."
        )}
      </p>

      <div className="mt-4 grid grid-cols-3 gap-3">
        {OPTIONS.map(({ mode: optionMode, label, icon: Icon, desc }) => {
          const active = mode === optionMode;
          return (
            <button
              key={optionMode}
              type="button"
              aria-pressed={active}
              onClick={() => setMode(optionMode)}
              className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-colors ${
                active
                  ? "border-gray-900 bg-gray-900/5 dark:border-white dark:bg-white/10"
                  : "border-border hover:bg-gray-50 dark:border-border-dark dark:hover:bg-white/5"
              }`}
            >
              <Icon
                size={20}
                strokeWidth={2}
                className={
                  active
                    ? "text-gray-900 dark:text-gray-100"
                    : "text-gray-400 dark:text-gray-500"
                }
              />
              <span
                className={`text-sm font-semibold ${
                  active ? "text-gray-900 dark:text-gray-100" : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {t(label)}
              </span>
              <span className="text-[11px] leading-tight text-gray-400 dark:text-gray-500">
                {t(desc)}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
