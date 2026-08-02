"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Coins,
  Eye,
  EyeOff,
  LayoutGrid,
  Languages,
  LineChart,
  Moon,
  Newspaper,
  Plus,
  Receipt,
  Settings,
  Sun,
  WalletCards,
} from "lucide-react";
import { useAssetModal } from "@/lib/asset-modal-context";
import { useDisplayCurrency } from "@/lib/currency-context";
import { useLocale } from "@/lib/i18n/locale-context";
import { useTheme } from "@/lib/theme-provider";

const navItems = [
  { href: "/", label: "대시보드", icon: LayoutGrid },
  { href: "/portfolio", label: "포트폴리오", icon: WalletCards },
  { href: "/analytics", label: "분석", icon: BarChart3 },
  { href: "/stocks", label: "주식", icon: LineChart },
  { href: "/dividends", label: "배당", icon: Coins },
  { href: "/tax", label: "세금", icon: Receipt },
  { href: "/news", label: "뉴스", icon: Newspaper },
  { href: "/settings", label: "설정", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { openAddModal } = useAssetModal();
  const { isAmountHidden, toggleAmountHidden } = useDisplayCurrency();
  const { locale, toggleLocale, t } = useLocale();
  const { theme, toggleTheme } = useTheme();

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
              {t(label)}
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
        {t("자산 추가")}
      </button>

      <div className="mt-auto flex items-center gap-1 px-1">
        <button
          type="button"
          aria-label={isAmountHidden ? t("금액 표시") : t("금액 숨기기")}
          aria-pressed={isAmountHidden}
          title={isAmountHidden ? t("금액 표시") : t("금액 숨기기")}
          onClick={toggleAmountHidden}
          className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-gray-100 dark:hover:bg-white/10 ${
            isAmountHidden
              ? "text-gray-900 dark:text-gray-100"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          {isAmountHidden ? <EyeOff size={18} strokeWidth={2} /> : <Eye size={18} strokeWidth={2} />}
        </button>
        <button
          type="button"
          aria-label={theme === "dark" ? t("라이트 모드로 전환") : t("다크 모드로 전환")}
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10"
        >
          {theme === "dark" ? <Sun size={18} strokeWidth={2} /> : <Moon size={18} strokeWidth={2} />}
        </button>
        <button
          type="button"
          aria-label={t("언어 전환")}
          title={locale === "ko" ? "English" : "한국어"}
          onClick={toggleLocale}
          className="flex h-9 items-center justify-center gap-1 rounded-full px-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10"
        >
          <Languages size={17} strokeWidth={2} />
          <span className="text-[11px] font-semibold uppercase">{locale}</span>
        </button>
      </div>
    </aside>
  );
}
