"use client";

import { Bell, RotateCcw } from "lucide-react";
import { usePortfolio } from "@/lib/portfolio-context";
import { useTradeModal } from "@/lib/trade-modal-context";

export default function Header() {
  const { resetPortfolio } = usePortfolio();
  const { showToast } = useTradeModal();

  const handleReset = () => {
    const confirmed = window.confirm(
      "테스트를 위해 보유 종목을 초기 더미 데이터로 되돌릴까요?"
    );
    if (!confirmed) return;
    resetPortfolio();
    showToast("초기 데이터로 재설정되었습니다.");
  };

  return (
    <header className="sticky top-0 z-10 bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-md items-center justify-between px-5 py-4">
        <span className="text-lg font-bold tracking-tight text-gray-900">
          NEXUS
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="초기 데이터로 재설정 (테스트용)"
            onClick={handleReset}
            className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 active:bg-gray-200"
          >
            <RotateCcw size={18} strokeWidth={2} />
          </button>
          <button
            type="button"
            aria-label="알림"
            className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 active:bg-gray-200"
          >
            <Bell size={20} strokeWidth={2} />
          </button>
        </div>
      </div>
    </header>
  );
}
