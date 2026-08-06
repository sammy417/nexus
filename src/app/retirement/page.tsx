"use client";

import { Target } from "lucide-react";
import RetirementInputsCard from "@/components/retirement/RetirementInputsCard";
import RetirementSummary from "@/components/retirement/RetirementSummary";
import ProjectionBandChart from "@/components/retirement/ProjectionBandChart";
import CurrencyToggle from "@/components/common/CurrencyToggle";
import OwnerFilterToggle from "@/components/common/OwnerFilterToggle";
import { Skeleton } from "@/components/common/Skeleton";
import { usePortfolio } from "@/lib/portfolio-context";
import { useDisplayCurrency } from "@/lib/currency-context";
import { useOwnerFilter } from "@/lib/owner-filter-context";
import { useSettings } from "@/lib/settings-context";
import { useT } from "@/lib/i18n/locale-context";
import { getPortfolioSummary } from "@/lib/services/portfolio-service";
import { selectOwnerHistory } from "@/lib/services/owner-history";
import { detectSavingsPace, projectRetirement } from "@/lib/services/retirement-service";
import { isRetirementConfigured } from "@/lib/models/retirement";

export default function RetirementPage() {
  const { assets, allAssets, snapshots, summary, isLoading } = usePortfolio();
  const { usdKrw } = useDisplayCurrency();
  const { ownerFilter } = useOwnerFilter();
  const { retirementInputs } = useSettings();
  const t = useT();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-72 w-full rounded-2xl" />
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    );
  }

  const inputs = retirementInputs(ownerFilter);

  // Owner-scoped principal history, so the saving pace matches the assets in
  // view — real byOwner where stored, else scaled by the current share.
  const household = getPortfolioSummary(allAssets, usdKrw);
  const fallbackShare = {
    principal: household.totalPrincipal === 0 ? 0 : summary.totalPrincipal / household.totalPrincipal,
    valuation: household.totalValuation === 0 ? 0 : summary.totalValuation / household.totalValuation,
  };
  const history = selectOwnerHistory(snapshots, ownerFilter, fallbackShare);
  const detectedPace = detectSavingsPace(history);

  const monthlySaving = inputs.useDetectedSaving
    ? detectedPace?.monthlyMedianKrw ?? 0
    : inputs.monthlySavingKrw;

  const configured = isRetirementConfigured(inputs);
  const projection = configured
    ? projectRetirement(inputs, summary.totalValuation, monthlySaving)
    : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t("은퇴 준비")}</h1>
          <p className="mt-1 text-sm font-medium text-gray-400 dark:text-gray-500">
            {t("지금 페이스로 가면 은퇴 시점에 얼마가 되고, 그 돈으로 몇 년을 살 수 있는지 추정합니다.")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <OwnerFilterToggle />
          <CurrencyToggle />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RetirementInputsCard scope={ownerFilter} detectedPace={detectedPace} />
        {projection ? (
          <RetirementSummary projection={projection} inputs={inputs} />
        ) : (
          <section className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-white p-10 text-center dark:border-border-dark dark:bg-card-dark">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-white/10 dark:text-gray-500">
              <Target size={20} />
            </span>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {t("출생연도와 월 생활비를 입력하면 진단이 시작됩니다")}
            </p>
            <p className="max-w-xs text-xs leading-relaxed text-gray-400 dark:text-gray-500">
              {t("보유 자산과 최근 저축 페이스는 앱이 이미 알고 있어요. 왼쪽에 계획만 채워 주세요.")}
            </p>
          </section>
        )}
      </div>

      {projection && <ProjectionBandChart projection={projection} history={history} />}

      {configured && assets.length === 0 && (
        <p className="px-1 text-[11px] text-gray-400 dark:text-gray-500">
          {t("선택한 소유자의 자산이 없어 현재 자산을 0으로 계산했습니다. 소유자 필터를 바꿔보세요.")}
        </p>
      )}
    </div>
  );
}
