"use client";

import { Moon, RotateCcw, Sun } from "lucide-react";
import { usePortfolio } from "@/lib/portfolio-context";
import { useAssetModal } from "@/lib/asset-modal-context";
import { useTheme } from "@/lib/theme-provider";

export default function Header() {
  const { resetPortfolio } = usePortfolio();
  const { showToast } = useAssetModal();
  const { theme, toggleTheme } = useTheme();

  const handleReset = () => {
    const confirmed = window.confirm(
      "테스트를 위해 자산 현황을 초기 더미 데이터로 되돌릴까요?"
    );
    if (!confirmed) return;
    resetPortfolio();
    showToast("초기 데이터로 재설정되었습니다.");
  };

  return (
    <header className="sticky top-0 z-10 bg-surface/80 backdrop-blur-md dark:bg-surface-dark/80">
      <div className="mx-auto flex max-w-md items-center justify-between px-5 py-4">
        <span className="text-lg font-bold tracking-tight text-gray-900 dark:text-gray-100">
          NEXUS
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="초기 데이터로 재설정 (테스트용)"
            onClick={handleReset}
            className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 active:bg-gray-200 dark:text-gray-400 dark:hover:bg-white/10 dark:active:bg-white/15"
          >
            <RotateCcw size={18} strokeWidth={2} />
          </button>
          <button
            type="button"
            aria-label={theme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환"}
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 active:bg-gray-200 dark:text-gray-400 dark:hover:bg-white/10 dark:active:bg-white/15"
          >
            {theme === "dark" ? <Sun size={18} strokeWidth={2} /> : <Moon size={18} strokeWidth={2} />}
          </button>
        </div>
      </div>
    </header>
  );
}
