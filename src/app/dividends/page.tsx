"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import MonthlyDividendChart from "@/components/dividends/MonthlyDividendChart";
import DividendFormDialog from "@/components/dividends/DividendFormDialog";
import DividendForecastCard from "@/components/dividends/DividendForecastCard";
import DividendSuggestions from "@/components/dividends/DividendSuggestions";
import UpcomingDividendsCard from "@/components/dividends/UpcomingDividendsCard";
import CurrencyToggle from "@/components/common/CurrencyToggle";
import OwnerFilterToggle from "@/components/common/OwnerFilterToggle";
import { useDividendForecast } from "@/lib/hooks/use-dividend-forecast";
import { useDividends } from "@/lib/hooks/use-dividends";
import { useDisplayCurrency } from "@/lib/currency-context";
import { useOwnerFilter } from "@/lib/owner-filter-context";
import { useAssetModal } from "@/lib/asset-modal-context";
import {
  dividendToKrw,
  getDividendSummary,
  getMonthlyDividends,
} from "@/lib/services/dividend-service";
import { formatMoney } from "@/lib/format";
import { DividendRecord } from "@/lib/models/dividend";
import { ASSET_OWNER_LABEL, OwnerFilter } from "@/lib/models/asset-owner";
import { AssetOwner } from "@/lib/models/asset";

function recordOwner(record: DividendRecord): AssetOwner {
  return record.owner ?? "JOINT";
}

function matchesOwner(owner: AssetOwner, filter: OwnerFilter): boolean {
  return filter === "ALL" || owner === filter;
}

const OWNER_BADGE_CLASS: Record<AssetOwner, string> = {
  SELF: "bg-fall/10 text-fall",
  SPOUSE: "bg-[#c9548a]/10 text-[#c9548a]",
  JOINT: "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400",
};

function formatMonthHeading(month: string): string {
  const [year, m] = month.split("-");
  return `${year}년 ${Number(m)}월`;
}

export default function DividendsPage() {
  const { dividends: allDividends, isLoading, addDividend, deleteDividend } = useDividends();
  const { forecast, isLoading: isForecastLoading } = useDividendForecast();
  const { displayCurrency, usdKrw } = useDisplayCurrency();
  const { ownerFilter } = useOwnerFilter();
  const { showToast } = useAssetModal();
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Every card below is scoped by the shared household owner filter.
  const dividends = useMemo(
    () => allDividends.filter((r) => matchesOwner(recordOwner(r), ownerFilter)),
    [allDividends, ownerFilter]
  );
  const scopedForecast = useMemo(() => {
    if (!forecast || ownerFilter === "ALL") return forecast;
    return {
      ...forecast,
      holdings: forecast.holdings.filter((h) => h.owner === ownerFilter),
      suggestions: forecast.suggestions.filter((s) => s.owner === ownerFilter),
    };
  }, [forecast, ownerFilter]);

  const summary = useMemo(() => getDividendSummary(dividends, usdKrw), [dividends, usdKrw]);
  const monthly = useMemo(() => getMonthlyDividends(dividends, usdKrw), [dividends, usdKrw]);

  const byMonth = useMemo(() => {
    const groups = new Map<string, DividendRecord[]>();
    for (const record of dividends) {
      const month = record.date.slice(0, 7);
      groups.set(month, [...(groups.get(month) ?? []), record]);
    }
    return [...groups.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [dividends]);

  async function handleDelete(record: DividendRecord) {
    const confirmed = window.confirm(
      `${record.date} ${record.name} 배당 기록을 삭제할까요?`
    );
    if (!confirmed) return;
    try {
      await deleteDividend(record.id);
      showToast("배당 기록이 삭제되었습니다.");
    } catch {
      showToast("삭제에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    }
  }

  if (isLoading) {
    return <p className="py-24 text-center text-sm text-gray-400 dark:text-gray-500">불러오는 중...</p>;
  }

  const tiles = [
    { label: "올해 누적 배당", valueKrw: summary.thisYearKrw },
    { label: "최근 12개월", valueKrw: summary.trailing12mKrw },
    { label: "월 평균 (최근 12개월)", valueKrw: summary.monthlyAverageKrw },
    { label: "이번 달", valueKrw: summary.thisMonthKrw },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">배당</h1>
        <div className="flex flex-wrap items-center gap-3">
          <OwnerFilterToggle />
          <CurrencyToggle />
          <button
            type="button"
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
          >
            <Plus size={15} strokeWidth={2.5} />
            배당 추가
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-2xl bg-white p-5 shadow-sm dark:bg-card-dark">
            <p className="text-xs font-medium text-gray-400 dark:text-gray-500">{tile.label}</p>
            <p className="mt-1.5 truncate text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              {formatMoney(tile.valueKrw, displayCurrency, usdKrw)}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[3fr_2fr]">
        <DividendForecastCard forecast={scopedForecast ?? null} isLoading={isForecastLoading} />
        <UpcomingDividendsCard forecast={scopedForecast ?? null} isLoading={isForecastLoading} />
      </div>

      {scopedForecast && (
        <DividendSuggestions
          suggestions={scopedForecast.suggestions}
          existing={allDividends}
          onAdd={async (input) => {
            await addDividend(input);
            showToast(`${input.name} 배당이 기록되었습니다.`);
          }}
        />
      )}

      <MonthlyDividendChart months={monthly} />

      {byMonth.length === 0 ? (
        <p className="py-16 text-center text-sm text-gray-400 dark:text-gray-500">
          아직 기록된 배당이 없습니다. 우측 상단의 &quot;배당 추가&quot;로 첫 기록을 남겨보세요.
        </p>
      ) : (
        byMonth.map(([month, records]) => {
          const monthTotal = records.reduce((sum, r) => sum + dividendToKrw(r, usdKrw), 0);
          return (
            <section key={month} className="flex flex-col gap-3">
              <div className="flex items-baseline justify-between px-1">
                <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                  {formatMonthHeading(month)} {records.length}건
                </h2>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {formatMoney(monthTotal, displayCurrency, usdKrw)}
                </p>
              </div>
              <ul className="divide-y divide-gray-50 rounded-2xl bg-white shadow-sm dark:divide-white/5 dark:bg-card-dark">
                {records.map((record) => (
                  <li key={record.id} className="group flex items-center justify-between px-5 py-3.5">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {record.name}
                        <span
                          className={`ml-1.5 rounded px-1 py-0.5 text-[10px] font-semibold ${
                            OWNER_BADGE_CLASS[recordOwner(record)]
                          }`}
                        >
                          {ASSET_OWNER_LABEL[recordOwner(record)]}
                        </span>
                        {record.currency === "USD" && (
                          <span className="ml-1 rounded bg-gray-100 px-1 py-0.5 text-[10px] font-semibold text-gray-500 dark:bg-white/10 dark:text-gray-400">
                            USD
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                        {record.date}
                        {record.memo ? ` · ${record.memo}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900 [font-variant-numeric:tabular-nums] dark:text-gray-100">
                        {formatMoney(dividendToKrw(record, usdKrw), displayCurrency, usdKrw)}
                      </p>
                      <button
                        type="button"
                        aria-label={`${record.name} 배당 기록 삭제`}
                        onClick={() => handleDelete(record)}
                        className="rounded-lg p-2 text-gray-300 opacity-70 transition-colors hover:bg-fall/10 hover:text-fall group-hover:opacity-100 dark:text-gray-600 dark:hover:bg-fall/15 dark:hover:text-fall"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        })
      )}

      {isFormOpen && (
        <DividendFormDialog
          onSubmit={async (input) => {
            await addDividend(input);
            showToast(`${input.name} 배당 기록이 추가되었습니다.`);
          }}
          onClose={() => setIsFormOpen(false)}
        />
      )}
    </div>
  );
}
