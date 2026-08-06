"use client";

import CapitalGainsCard from "@/components/tax/CapitalGainsCard";
import FinancialIncomeCard from "@/components/tax/FinancialIncomeCard";
import PensionCreditCard from "@/components/tax/PensionCreditCard";
import PensionWithdrawalCard from "@/components/tax/PensionWithdrawalCard";
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
 *
 * 공동(JOINT)은 세법상 존재하지 않는 귀속이라(실제로는 어느 한 사람 명의의
 * 계좌다) 세금 화면에서는 아예 제외한다 — 공동 명의로 묶인 자산·배당은
 * 실제 명의자로 태그를 바꾼 뒤 그 사람 섹션에서 계산하면 된다.
 */
const TAXABLE_OWNERS = ASSET_OWNERS.filter((owner) => owner !== "JOINT");
export default function TaxPage() {
  const { allAssets, isLoading: isPortfolioLoading } = usePortfolio();
  const { dividends, isLoading: isDividendsLoading } = useDividends();
  const {
    forecast,
    isLoading: isForecastLoading,
    hasError: forecastHasError,
  } = useDividendForecast();
  const { ownerName, ownerColor } = useSettings();
  const t = useT();

  if (isPortfolioLoading || isDividendsLoading) {
    return <TaxSkeleton />;
  }

  const sections = TAXABLE_OWNERS.map((owner) => {
    const ownerAssets = allAssets.filter((a) => getAssetOwner(a) === owner);
    const ownerDividends = dividends.filter((r) => recordOwner(r) === owner);
    const ownerForecastHoldings = (forecast?.holdings ?? []).filter((h) => h.owner === owner);
    return { owner, ownerAssets, ownerDividends, ownerForecastHoldings };
  }).filter(({ ownerAssets, ownerDividends }) => ownerAssets.length > 0 || ownerDividends.length > 0);

  // Joint-tagged items are silently absent from every section above, so say so.
  const hasJointItems =
    allAssets.some((a) => getAssetOwner(a) === "JOINT") ||
    dividends.some((r) => recordOwner(r) === "JOINT");

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

      {hasJointItems && (
        <p className="-mt-2 px-1 text-[11px] leading-relaxed text-gray-400 dark:text-gray-500">
          {t(
            "공동 명의로 태그된 자산·배당은 제외했습니다 — 세법상 '공동' 귀속은 없고 실제로는 어느 한 사람 명의의 계좌이므로, 실제 명의자로 소유자를 바꾸면 그 사람 계산에 반영됩니다."
          )}
        </p>
      )}

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
            <CapitalGainsCard assets={ownerAssets} owner={owner} />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <FinancialIncomeCard
                records={ownerDividends}
                owner={owner}
                forecastHoldings={ownerForecastHoldings}
                isForecastLoading={isForecastLoading}
                forecastHasError={forecastHasError}
              />
              <PensionCreditCard
                pensionAssets={ownerAssets.filter((a) => a.type === "PENSION")}
                owner={owner}
              />
            </div>

            {/* Withdrawal side — only when there's actually a pension to draw. */}
            {ownerAssets.some((a) => a.type === "PENSION") && (
              <PensionWithdrawalCard
                pensionAssets={ownerAssets.filter((a) => a.type === "PENSION")}
              />
            )}
          </section>
        ))
      )}
    </div>
  );
}
