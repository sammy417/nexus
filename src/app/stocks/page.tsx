"use client";

import { LineChart, Plus, TrendingDown, TrendingUp } from "lucide-react";
import DonutBreakdownCard from "@/components/common/DonutBreakdownCard";
import StockTable from "@/components/stocks/StockTable";
import StockValuationTable from "@/components/stocks/StockValuationTable";
import StockRiskSection from "@/components/stocks/StockRiskSection";
import StocksSkeleton from "@/components/skeletons/StocksSkeleton";
import EmptyState from "@/components/common/EmptyState";
import CurrencyToggle from "@/components/common/CurrencyToggle";
import OwnerFilterToggle from "@/components/common/OwnerFilterToggle";
import RefreshPricesButton from "@/components/common/RefreshPricesButton";
import { usePortfolio } from "@/lib/portfolio-context";
import { useDisplayCurrency } from "@/lib/currency-context";
import { useOwnerFilter } from "@/lib/owner-filter-context";
import { useSettings } from "@/lib/settings-context";
import { useAssetModal } from "@/lib/asset-modal-context";
import { useT } from "@/lib/i18n/locale-context";
import { formatPercent } from "@/lib/format";
import { sectorColor } from "@/lib/models/stock-sector";
import {
  getConcentration,
  getContributions,
  getCurrencyAllocation,
  getRegionAllocation,
  getSectorAllocation,
  getStockHoldings,
  getStockSummary,
  isStock,
  type GroupWeight,
} from "@/lib/services/stock-analysis-service";

const REGION_COLOR: Record<string, string> = { KR: "#3182F6", FOREIGN: "#c9548a" };
const CURRENCY_COLOR: Record<string, string> = { KRW: "#1baf7a", USD: "#c98500" };

export default function StocksPage() {
  const { assets, allAssets, isLoading } = usePortfolio();
  const { money, signedMoney, usdKrw } = useDisplayCurrency();
  const { ownerFilter } = useOwnerFilter();
  const { ownerName } = useSettings();
  const { openAddModal } = useAssetModal();
  const t = useT();

  if (isLoading) return <StocksSkeleton />;

  const holdings = getStockHoldings(assets, usdKrw);

  const header = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t("주식")}</h1>
      <div className="flex flex-wrap items-center gap-3">
        <RefreshPricesButton />
        <OwnerFilterToggle />
        <CurrencyToggle />
      </div>
    </div>
  );

  if (holdings.length === 0) {
    const noneAtAll = allAssets.filter(isStock).length === 0;
    return (
      <div className="flex flex-col gap-6">
        {header}
        <EmptyState
          icon={LineChart}
          title={
            noneAtAll
              ? t("아직 등록한 주식이 없어요")
              : ownerFilter === "ALL"
                ? t("주식 자산이 없어요")
                : t("{owner} 주식 자산이 없어요", { owner: ownerName(ownerFilter) })
          }
          description={t(
            "주식을 추가하면 섹터·지역 구성과 종목별 성과·집중도 분석이 여기에 표시됩니다."
          )}
          action={{
            label: t("주식 추가"),
            onClick: openAddModal,
            icon: <Plus size={16} strokeWidth={2.5} />,
          }}
        />
      </div>
    );
  }

  const summary = getStockSummary(holdings);
  const sectors = getSectorAllocation(holdings);
  const regions = getRegionAllocation(holdings);
  const currencies = getCurrencyAllocation(holdings);
  const concentration = getConcentration(holdings);
  const contributions = getContributions(holdings);
  const best = contributions[0];
  const worst = contributions[contributions.length - 1];
  const hasBest = !!best && best.holding.profit > 0;
  const hasWorst = !!worst && worst.holding.profit < 0;

  const regionLabel = (key: string) => (key === "KR" ? t("국내") : t("해외"));
  const currencyLabel = (key: string) => (key === "KRW" ? t("원화") : t("달러"));

  return (
    <div className="flex flex-col gap-6">
      {header}

      {/* Summary tiles */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Tile label={t("주식 평가 금액")} value={money(summary.totalValuation)} />
        <Tile
          label={t("평가 손익")}
          value={signedMoney(summary.totalProfit)}
          sub={formatPercent(summary.totalProfitRate)}
          tone={summary.totalProfit >= 0 ? "rise" : "fall"}
        />
        <Tile
          label={t("보유 종목")}
          value={t("{count}종목", { count: summary.count })}
          sub={t("상승 {gainers} · 하락 {losers}", {
            gainers: summary.gainers,
            losers: summary.losers,
          })}
        />
        <Tile
          label={t("분산 점수")}
          value={`${concentration.diversificationScore}/100`}
          sub={t("실질 {n}종목", { n: concentration.effectiveN.toFixed(1) })}
        />
      </div>

      {/* Sector donut + region/currency exposure */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DonutBreakdownCard
          title={t("섹터 구성")}
          subtitle={t("보유 주식 평가금액 기준")}
          ariaLabel={t("섹터별 주식 구성 도넛 차트")}
          centerTitle={t("주식 평가 금액")}
          entries={sectors.map((s) => ({
            id: s.key,
            label: t(s.key),
            color: sectorColor(s.key),
            valuation: s.valuation,
            ratio: s.ratio,
          }))}
        />

        <section className="flex flex-col gap-5 rounded-2xl bg-white p-6 shadow-sm dark:bg-card-dark">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t("지역 구성")}</p>
            <WeightBars groups={regions} labelFor={regionLabel} colorMap={REGION_COLOR} money={money} />
          </div>
          <div className="border-t border-border pt-4 dark:border-border-dark">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {t("통화 노출")}
            </p>
            <WeightBars
              groups={currencies}
              labelFor={currencyLabel}
              colorMap={CURRENCY_COLOR}
              money={money}
            />
          </div>
        </section>
      </div>

      {/* Concentration + top contributors */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[3fr_2fr]">
        <section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-card-dark">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t("집중도")}</p>
          <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
            {t("상위 종목 쏠림과 분산 정도")}
          </p>
          <div className="mt-4 grid grid-cols-3 gap-4">
            <Metric label={t("Top 5 비중")} value={`${concentration.top5Weight.toFixed(0)}%`} />
            <Metric label={t("실질 종목 수")} value={concentration.effectiveN.toFixed(1)} />
            <Metric label={t("보유 종목")} value={String(concentration.count)} />
          </div>
          {concentration.top5Weight >= 60 && (
            <p className="mt-4 rounded-xl bg-fall/10 px-3 py-2 text-[11px] font-medium text-fall">
              {t("상위 5개 종목에 집중되어 있습니다. 분산을 검토해 보세요.")}
            </p>
          )}
        </section>

        <section className="flex flex-col gap-3 rounded-2xl bg-white p-6 shadow-sm dark:bg-card-dark">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t("손익 기여")}</p>
          {hasBest && (
            <Contributor
              icon={<TrendingUp size={15} className="text-rise" />}
              label={t("수익 기여 1위")}
              name={best.holding.asset.name}
              value={signedMoney(best.holding.profit)}
              tone="rise"
            />
          )}
          {hasWorst && (
            <Contributor
              icon={<TrendingDown size={15} className="text-fall" />}
              label={t("손실 기여 1위")}
              name={worst.holding.asset.name}
              value={signedMoney(worst.holding.profit)}
              tone="fall"
            />
          )}
          {!hasBest && !hasWorst && (
            <p className="py-4 text-center text-xs text-gray-400 dark:text-gray-500">
              {t("손익 기여를 표시할 데이터가 부족합니다.")}
            </p>
          )}
        </section>
      </div>

      {/* Per-stock table */}
      <StockTable rows={contributions} />

      {/* Valuation comparison (external fundamentals) */}
      <StockValuationTable stocks={holdings.map((h) => h.asset)} />

      {/* Risk: volatility / return / drawdown + correlation heatmap */}
      <StockRiskSection stocks={holdings.map((h) => h.asset)} />
    </div>
  );
}

function Tile({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "rise" | "fall";
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-card-dark">
      <p className="text-xs font-medium text-gray-400 dark:text-gray-500">{label}</p>
      <p
        className={`mt-1.5 truncate text-2xl font-bold tracking-tight ${
          tone === "rise" ? "text-rise" : tone === "fall" ? "text-fall" : "text-gray-900 dark:text-gray-100"
        }`}
      >
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs font-medium text-gray-400 dark:text-gray-500">{sub}</p>}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border p-3 text-center dark:border-border-dark">
      <p className="text-lg font-bold tracking-tight text-gray-900 dark:text-gray-100">{value}</p>
      <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">{label}</p>
    </div>
  );
}

function WeightBars({
  groups,
  labelFor,
  colorMap,
  money,
}: {
  groups: GroupWeight[];
  labelFor: (key: string) => string;
  colorMap: Record<string, string>;
  money: (krw: number) => string;
}) {
  return (
    <ul className="mt-3 flex flex-col gap-2.5">
      {groups.map((g) => (
        <li key={g.key} className="flex items-center gap-3 text-sm">
          <span className="w-12 shrink-0 text-xs font-medium text-gray-700 dark:text-gray-300">
            {labelFor(g.key)}
          </span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-white/5">
            <div
              className="h-full rounded-full"
              style={{ width: `${Math.max(g.ratio, 2)}%`, backgroundColor: colorMap[g.key] ?? "#8a95a3" }}
            />
          </div>
          <span className="w-12 shrink-0 text-right text-xs font-semibold text-gray-900 dark:text-gray-100">
            {g.ratio.toFixed(0)}%
          </span>
          <span className="hidden w-24 shrink-0 text-right text-xs text-gray-400 sm:block dark:text-gray-500">
            {money(g.valuation)}
          </span>
        </li>
      ))}
    </ul>
  );
}

function Contributor({
  icon,
  label,
  name,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  name: string;
  value: string;
  tone: "rise" | "fall";
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-3 dark:border-border-dark">
      <div className="flex min-w-0 items-center gap-2">
        {icon}
        <div className="min-w-0">
          <p className="text-[11px] text-gray-400 dark:text-gray-500">{label}</p>
          <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{name}</p>
        </div>
      </div>
      <p className={`shrink-0 text-sm font-semibold ${tone === "rise" ? "text-rise" : "text-fall"}`}>
        {value}
      </p>
    </div>
  );
}
