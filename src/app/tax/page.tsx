"use client";

import CapitalGainsCard from "@/components/tax/CapitalGainsCard";
import FinancialIncomeCard from "@/components/tax/FinancialIncomeCard";
import PensionCreditCard from "@/components/tax/PensionCreditCard";
import CurrencyToggle from "@/components/common/CurrencyToggle";
import OwnerFilterToggle from "@/components/common/OwnerFilterToggle";
import TaxSkeleton from "@/components/skeletons/TaxSkeleton";
import { usePortfolio } from "@/lib/portfolio-context";
import { useDividends } from "@/lib/hooks/use-dividends";
import { useT } from "@/lib/i18n/locale-context";

export default function TaxPage() {
  const { assets, isLoading: isPortfolioLoading } = usePortfolio();
  const { dividends, isLoading: isDividendsLoading } = useDividends();
  const t = useT();

  if (isPortfolioLoading || isDividendsLoading) {
    return <TaxSkeleton />;
  }

  const pensionAssets = assets.filter((a) => a.type === "PENSION");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t("세금")}</h1>
          <p className="mt-1 text-sm font-medium text-gray-400 dark:text-gray-500">
            {t("보유 현황 기준의 세금 시뮬레이션 — 실제 세액이 아닌 추정치입니다")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <OwnerFilterToggle />
          <CurrencyToggle />
        </div>
      </div>

      <CapitalGainsCard assets={assets} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <FinancialIncomeCard records={dividends} />
        <PensionCreditCard pensionAssets={pensionAssets} />
      </div>
    </div>
  );
}
