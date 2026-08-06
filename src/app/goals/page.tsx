"use client";

import { useState } from "react";
import { Flag, Plus } from "lucide-react";
import GoalCard from "@/components/goals/GoalCard";
import GoalFormModal from "@/components/goals/GoalFormModal";
import UnassignedAssetsCard from "@/components/goals/UnassignedAssetsCard";
import CurrencyToggle from "@/components/common/CurrencyToggle";
import { Skeleton } from "@/components/common/Skeleton";
import { usePortfolio } from "@/lib/portfolio-context";
import { useDisplayCurrency } from "@/lib/currency-context";
import { useSettings } from "@/lib/settings-context";
import { useAssetModal } from "@/lib/asset-modal-context";
import { useT } from "@/lib/i18n/locale-context";
import {
  assignAssetToGoal,
  createGoal,
  Goal,
  unassignAsset,
} from "@/lib/models/goal";
import { getAllGoalProgress, getUnassignedAssets } from "@/lib/services/goal-service";

export default function GoalsPage() {
  const { allAssets, isLoading } = usePortfolio();
  const { usdKrw } = useDisplayCurrency();
  const { settings, save } = useSettings();
  const { showToast } = useAssetModal();
  const t = useT();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-56 w-full rounded-2xl" />
      </div>
    );
  }

  const goals = settings.goals;
  const progress = getAllGoalProgress(goals, allAssets, usdKrw);
  const unassigned = getUnassignedAssets(allAssets, goals, usdKrw);

  /** Persist a new goals list, tolerating a failed save. */
  async function persist(nextGoals: Goal[], toast?: string) {
    try {
      await save({ ...settings, goals: nextGoals });
      if (toast) showToast(toast);
    } catch {
      showToast(t("저장에 실패했습니다. 잠시 후 다시 시도해 주세요."));
    }
  }

  function openAdd() {
    setEditingGoal(null);
    setModalOpen(true);
  }
  function openEdit(goal: Goal) {
    setEditingGoal(goal);
    setModalOpen(true);
  }

  function handleSubmit(fields: { name: string; targetAmountKrw: number; targetDate: string }) {
    if (editingGoal) {
      persist(
        goals.map((g) => (g.id === editingGoal.id ? { ...g, ...fields } : g)),
        t("목표가 수정되었습니다.")
      );
    } else {
      const goal = createGoal(fields.name, fields.targetAmountKrw, fields.targetDate);
      persist([...goals, goal], t("목표가 추가되었습니다."));
    }
    setModalOpen(false);
  }

  function handleDelete() {
    if (!editingGoal) return;
    persist(goals.filter((g) => g.id !== editingGoal.id), t("목표가 삭제되었습니다."));
    setModalOpen(false);
  }

  function handleToggleAsset(goalId: string, assetId: string, assign: boolean) {
    persist(assign ? assignAssetToGoal(goals, goalId, assetId) : unassignAsset(goals, assetId));
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t("목표")}</h1>
          <p className="mt-1 text-sm font-medium text-gray-400 dark:text-gray-500">
            {t("주택·교육 등 시점이 있는 목표에 자산을 배정하고 진행률을 추적합니다.")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CurrencyToggle />
          <button
            type="button"
            onClick={openAdd}
            className="flex items-center gap-1.5 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
          >
            <Plus size={16} />
            {t("목표 추가")}
          </button>
        </div>
      </div>

      {goals.length === 0 ? (
        <section className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-white p-12 text-center dark:border-border-dark dark:bg-card-dark">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-white/10 dark:text-gray-500">
            <Flag size={20} />
          </span>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {t("첫 목표를 추가해 보세요")}
          </p>
          <p className="max-w-xs text-xs leading-relaxed text-gray-400 dark:text-gray-500">
            {t("목표 금액과 시점을 정하고 보유 자산을 배정하면, 진행률과 필요한 월 저축액을 계산해 드려요.")}
          </p>
        </section>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {progress.map((p) => (
              <GoalCard
                key={p.goal.id}
                progress={p}
                goals={goals}
                assets={allAssets}
                onEdit={() => openEdit(p.goal)}
                onToggleAsset={(assetId, assign) => handleToggleAsset(p.goal.id, assetId, assign)}
              />
            ))}
          </div>
          {allAssets.length > 0 && (
            <UnassignedAssetsCard assets={unassigned.assets} totalKrw={unassigned.totalKrw} />
          )}
        </>
      )}

      {modalOpen && (
        <GoalFormModal
          editingGoal={editingGoal}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmit}
          onDelete={editingGoal ? handleDelete : null}
        />
      )}
    </div>
  );
}
