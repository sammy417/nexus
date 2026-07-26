"use client";

import { BarChart3, Coins, Plus, Users, WalletCards } from "lucide-react";
import { useAssetModal } from "@/lib/asset-modal-context";

const FEATURES = [
  {
    icon: WalletCards,
    title: "다양한 자산 한눈에",
    description: "주식(국내·해외)·채권·현금·연금·기타까지 보유 현황을 한 곳에서 관리해요.",
  },
  {
    icon: Users,
    title: "가족별로 분리 관리",
    description: "본인·배우자·자녀·공동 소유자 태그로 나누고, 전체 합산도 함께 볼 수 있어요.",
  },
  {
    icon: BarChart3,
    title: "추이와 수익률 분석",
    description: "일별 스냅샷으로 총자산 추이·기간 수익률·최대 낙폭을 자동으로 계산해요.",
  },
  {
    icon: Coins,
    title: "배당 기록과 예측",
    description: "받은 배당을 기록하고, 보유 종목의 예상 연간 배당까지 자동으로 보여줘요.",
  },
];

/** First-run welcome shown when the household has no assets yet. */
export default function DashboardOnboarding() {
  const { openAddModal } = useAssetModal();

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col items-center rounded-2xl bg-white px-6 py-16 text-center shadow-sm dark:bg-card-dark">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-900 text-white dark:bg-white dark:text-gray-900">
          <WalletCards size={26} strokeWidth={2} />
        </span>
        <h1 className="mt-5 text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          NEXUS에 오신 걸 환영해요
        </h1>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-gray-400 dark:text-gray-500">
          우리 집 자산을 한 곳에 모아 관리하는 첫걸음이에요. 첫 자산을 추가하면 대시보드·분석·배당
          화면이 자동으로 채워집니다.
        </p>
        <button
          type="button"
          onClick={openAddModal}
          className="mt-6 flex items-center gap-1.5 rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
        >
          <Plus size={16} strokeWidth={2.5} />
          첫 자산 추가하기
        </button>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {FEATURES.map(({ icon: Icon, title, description }) => (
          <div key={title} className="rounded-2xl bg-white p-5 shadow-sm dark:bg-card-dark">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-50 text-gray-500 dark:bg-white/5 dark:text-gray-400">
              <Icon size={18} strokeWidth={2} />
            </span>
            <p className="mt-3 text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</p>
            <p className="mt-1 text-xs leading-relaxed text-gray-400 dark:text-gray-500">
              {description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
