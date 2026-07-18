"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, LayoutGrid, Moon, Plus, RotateCcw, Sun, WalletCards } from "lucide-react";
import { useAssetModal } from "@/lib/asset-modal-context";
import { usePortfolio } from "@/lib/portfolio-context";
import { useTheme } from "@/lib/theme-provider";

const navItems = [
  { href: "/", label: "대시보드", icon: LayoutGrid },
  { href: "/portfolio", label: "포트폴리오", icon: WalletCards },
  { href: "/analytics", label: "분석", icon: BarChart3 },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { openAddModal, showToast } = useAssetModal();
  const { resetPortfolio } = usePortfolio();
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
    <aside className="sticky top-0 flex h-dvh w-60 shrink-0 flex-col border-r border-border bg-white px-4 py-6 dark:border-border-dark dark:bg-card-dark">
      <Link href="/" className="px-3 text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
        NEXUS
      </Link>

      <nav className="mt-8 flex flex-col gap-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-gray-900/5 text-gray-900 dark:bg-white/10 dark:text-gray-100"
                  : "text-gray-500 hover:bg-gray-900/5 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200"
              }`}
            >
              <Icon size={18} strokeWidth={2} />
              {label}
            </Link>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={openAddModal}
        className="mt-6 flex items-center justify-center gap-1.5 rounded-xl bg-gray-900 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
      >
        <Plus size={16} strokeWidth={2.5} />
        자산 추가
      </button>

      <div className="mt-auto flex items-center gap-1 px-1">
        <button
          type="button"
          aria-label={theme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환"}
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10"
        >
          {theme === "dark" ? <Sun size={18} strokeWidth={2} /> : <Moon size={18} strokeWidth={2} />}
        </button>
        <button
          type="button"
          aria-label="초기 데이터로 재설정 (테스트용)"
          onClick={handleReset}
          className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10"
        >
          <RotateCcw size={17} strokeWidth={2} />
        </button>
      </div>
    </aside>
  );
}
