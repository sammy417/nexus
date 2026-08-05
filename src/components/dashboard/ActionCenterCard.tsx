"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, Check, ChevronDown, ChevronRight, Coins, PiggyBank, Receipt, Scale } from "lucide-react";
import { Asset } from "@/lib/models/asset";
import { DividendRecord } from "@/lib/models/dividend";
import { hexWithAlpha } from "@/lib/models/asset-owner";
import { currentTaxYear } from "@/lib/models/tax-inputs";
import { Skeleton } from "@/components/common/Skeleton";
import DataErrorNotice from "@/components/common/DataErrorNotice";
import { useDisplayCurrency } from "@/lib/currency-context";
import { useSettings } from "@/lib/settings-context";
import { useT } from "@/lib/i18n/locale-context";
import {
  getActionItems,
  type ActionCategory,
  type ActionItem,
  type ActionSeverity,
} from "@/lib/services/action-center-service";
import type { HoldingDividendForecast } from "@/lib/services/dividend-forecast-service";

/** Params that hold a KRW amount and must go through `money()`. */
const MONEY_PARAMS = new Set(["amount", "excess", "remaining", "exemption", "limit"]);

const SEVERITY_COLOR: Record<ActionSeverity, string> = {
  URGENT: "#F04452",
  ATTENTION: "#c98500",
  INFO: "#3182F6",
};

const CATEGORY_ICON: Record<ActionCategory, typeof Scale> = {
  REBALANCE: Scale,
  TAX: Receipt,
  DIVIDEND: Coins,
  PENSION: PiggyBank,
};

/** Items shown before the "더보기" toggle. */
const DEFAULT_VISIBLE = 5;

/**
 * 대시보드 상단 "오늘 챙길 것" — 리밸런싱·세금·배당·연금 인사이트가 7개
 * 메뉴에 흩어져 있어, 지금 행동이 필요한 것만 모아 심각도 순으로 보여준다.
 */
export default function ActionCenterCard({
  scopedAssets,
  allAssets,
  dividends,
  forecastHoldings,
  isLoading,
  forecastHasError = false,
  className = "",
}: {
  scopedAssets: Asset[];
  allAssets: Asset[];
  dividends: DividendRecord[];
  forecastHoldings: HoldingDividendForecast[];
  isLoading: boolean;
  /** Forecast lookup failed — dividend/tax items may be missing. */
  forecastHasError?: boolean;
  className?: string;
}) {
  const { usdKrw, money } = useDisplayCurrency();
  const { targetAllocation, ownerName, settings } = useSettings();
  const t = useT();
  const [expanded, setExpanded] = useState(false);

  const items = isLoading
    ? []
    : getActionItems({
        scopedAssets,
        allAssets,
        dividends,
        forecastHoldings,
        usdKrw,
        targetAllocation,
        // Unrecorded payouts entered on the 세금 page count toward the
        // 종합과세 threshold here too, or the two screens disagree.
        taxInputs: settings.taxInputs?.[currentTaxYear()],
      });

  const hiddenCount = items.length - DEFAULT_VISIBLE;
  const isCollapsible = hiddenCount > 0;
  const visible = isCollapsible && !expanded ? items.slice(0, DEFAULT_VISIBLE) : items;

  /** Localize an item's params: owners → display name, KRW → money(). */
  function renderTitle(item: ActionItem): string {
    const params: Record<string, string | number> = {};
    for (const [key, value] of Object.entries(item.params ?? {})) {
      if (key === "owner") params[key] = ownerName(value as never);
      else if (key === "category") params[key] = t(String(value));
      else if (MONEY_PARAMS.has(key)) params[key] = money(Number(value));
      else params[key] = value;
    }
    return t(item.title, params);
  }

  return (
    <section className={`flex flex-col rounded-2xl bg-white p-6 shadow-sm dark:bg-card-dark ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t("오늘 챙길 것")}</p>
        {!isLoading && items.length > 0 && (
          <span
            className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
            style={{
              color: SEVERITY_COLOR[items[0].severity],
              backgroundColor: hexWithAlpha(SEVERITY_COLOR[items[0].severity], 0.12),
            }}
          >
            {t("{count}건", { count: items.length })}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="mt-4 flex flex-col gap-2.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-center">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full"
            style={{ color: "#1baf7a", backgroundColor: hexWithAlpha("#1baf7a", 0.12) }}
          >
            <Check size={20} strokeWidth={2.5} />
          </span>
          <p className="mt-3 text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("지금 조치할 일이 없어요")}
          </p>
          <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
            {t("목표 배분·세금 기준·배당 일정 모두 여유가 있습니다.")}
          </p>
        </div>
      ) : (
        <>
          <ul className="mt-4 flex flex-col gap-1.5">
            {visible.map((item) => {
              const color = SEVERITY_COLOR[item.severity];
              const Icon = item.severity === "URGENT" ? AlertTriangle : CATEGORY_ICON[item.category];
              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-gray-50 dark:hover:bg-white/5"
                  >
                    <span
                      aria-hidden
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                      style={{ color, backgroundColor: hexWithAlpha(color, 0.12) }}
                    >
                      <Icon size={14} strokeWidth={2.25} />
                    </span>
                    <span className="min-w-0 flex-1 text-xs leading-relaxed text-gray-700 dark:text-gray-300">
                      {renderTitle(item)}
                    </span>
                    <ChevronRight
                      size={15}
                      className="shrink-0 text-gray-300 transition-colors group-hover:text-gray-500 dark:text-gray-600 dark:group-hover:text-gray-400"
                    />
                  </Link>
                </li>
              );
            })}
          </ul>

          {isCollapsible && (
            <button
              type="button"
              onClick={() => setExpanded((prev) => !prev)}
              className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg py-2 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200"
            >
              {expanded ? t("접기") : t("더보기 ({count}개 더)", { count: hiddenCount })}
              <ChevronDown
                size={14}
                className={`transition-transform ${expanded ? "rotate-180" : ""}`}
              />
            </button>
          )}
        </>
      )}

      {!isLoading && forecastHasError && (
        <DataErrorNotice
          className="mt-4"
          message="배당 예측을 불러오지 못해 배당·금융소득 관련 항목이 빠져 있을 수 있습니다."
        />
      )}
    </section>
  );
}
