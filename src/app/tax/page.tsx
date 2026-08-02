"use client";

import CapitalGainsCard from "@/components/tax/CapitalGainsCard";
import FinancialIncomeCard from "@/components/tax/FinancialIncomeCard";
import PensionCreditCard from "@/components/tax/PensionCreditCard";
import CurrencyToggle from "@/components/common/CurrencyToggle";
import EmptyState from "@/components/common/EmptyState";
import TaxSkeleton from "@/components/skeletons/TaxSkeleton";
import { usePortfolio } from "@/lib/portfolio-context";
import { useDividends } from "@/lib/hooks/use-dividends";
import { useDividendForecast } from "@/lib/hooks/use-dividend-forecast";
import { useSettings } from "@/lib/settings-context";
import { useT } from "@/lib/i18n/locale-context";
import { ASSET_OWNERS, getAssetOwner } from "@/lib/models/asset-owner";
import { AssetOwner } from "@/lib/models/asset";
import { DividendRecord } from "@/lib/models/dividend";
import { Receipt } from "lucide-react";

function recordOwner(record: DividendRecord): AssetOwner {
  return record.owner ?? "JOINT";
}

/**
 * 세금은 가구가 아니라 개인 단위로 매겨진다 — 해외주식 양도세의 연 250만원
 * 공제, 금융소득종합과세의 2천만원 기준, 연금 세액공제 한도 모두 각자
 * 별도로 적용된다. 그래서 이 페이지는 "전체 합산" 뷰 대신 소유자별로 완전히
 * 분리된 섹션을 보여준다 — 자산·배당이 없는 소유자는 섹션 자체를 생략한다.
 */
export default function TaxPage() {
  const { allAssets, isLoading: isPortfolioLoading } = usePortfolio();
  const { dividends, isLoading: isDividendsLoading } = useDividends();
  const { forecast, isLoading: isForecastLoading } = useDividendForecast();
  const { ownerName, ownerColor } = useSettings();
  const t = useT();

  if (isPortfolioLoading || isDividendsLoading) {
    return <TaxSkeleton />;
  }

  const sections = ASSET_OWNERS.map((owner) => {
    const ownerAssets = allAssets.filter((a) => getAssetOwner(a) === owner);
    const ownerDividends = dividends.filter((r) => recordOwner(r) === owner);
    const ownerForecastHoldings = (forecast?.holdings ?? []).filter((h) => h.owner === owner);
    return { owner, ownerAssets, ownerDividends, ownerForecastHoldings };
  }).filter(({ ownerAssets, ownerDividends }) => ownerAssets.length > 0 || ownerDividends.length > 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t("세금")}</h1>
          <p className="mt-1 text-sm font-medium text-gray-400 dark:text-gray-500">
            {t(
              "보유 현황 기준의 세금 시뮬레이션 — 실제 세액이 아닌 추정치입니다. 공제·기준금액이 개인별로 적용돼 소유자별로 나누어 계산합니다."
            )}
          </p>
        </div>
        <CurrencyToggle />
      </div>

      {sections.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title={t("계산할 자산·배당이 없어요")}
          description={t("주식이나 배당 기록을 추가하면 소유자별 세금 시뮬레이션이 여기에 표시됩니다.")}
        />
      ) : (
        sections.map(({ owner, ownerAssets, ownerDividends, ownerForecastHoldings }) => (
          <section key={owner} className="flex flex-col gap-4">
            <div className="flex items-center gap-2 px-1">
              <span
                aria-hidden
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: ownerColor(owner) }}
              />
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {ownerName(owner)}
              </h2>
            </div>
            {owner === "JOINT" && (
              <p className="-mt-2 px-1 text-[11px] text-gray-400 dark:text-gray-500">
                {t(
                  "공동 명의 자산은 실제로는 한 사람 명의 계좌일 가능성이 높습니다 — 실제 신고 시 해당 명의자 기준으로 다시 확인하세요."
                )}
              </p>
            )}

            <CapitalGainsCard assets={ownerAssets} />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <FinancialIncomeCard
                records={ownerDividends}
                forecastHoldings={ownerForecastHoldings}
                isForecastLoading={isForecastLoading}
              />
              <PensionCreditCard
                pensionAssets={ownerAssets.filter((a) => a.type === "PENSION")}
              />
            </div>
          </section>
        ))
      )}
    </div>
  );
}
