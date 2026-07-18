"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Plus, WalletCards } from "lucide-react";
import { useAssetModal } from "@/lib/asset-modal-context";

const navItems = [
  { href: "/", label: "대시보드", icon: LayoutGrid },
  { href: "/portfolio", label: "포트폴리오", icon: WalletCards },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { openAddModal } = useAssetModal();

  return (
    <nav className="sticky bottom-0 z-10 border-t border-border bg-white/90 backdrop-blur-md dark:border-border-dark dark:bg-card-dark/90">
      <div className="relative mx-auto flex max-w-md items-center justify-around px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-1 flex-col items-center gap-1 py-1.5"
            >
              <Icon
                size={22}
                strokeWidth={2}
                className={isActive ? "text-gray-900 dark:text-gray-100" : "text-gray-400 dark:text-gray-500"}
              />
              <span
                className={`text-[11px] font-medium ${
                  isActive ? "text-gray-900 dark:text-gray-100" : "text-gray-400 dark:text-gray-500"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
        <button
          type="button"
          aria-label="자산 추가"
          onClick={openAddModal}
          className="flex flex-1 flex-col items-center gap-1 py-1.5 text-gray-400 transition-colors hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
        >
          <Plus size={22} strokeWidth={2} />
          <span className="text-[11px] font-medium">자산 추가</span>
        </button>
      </div>
    </nav>
  );
}
