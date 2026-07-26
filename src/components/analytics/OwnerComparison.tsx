"use client";

import { Asset } from "@/lib/models/asset";
import { ASSET_OWNERS, getAssetOwner, OWNER_COLOR } from "@/lib/models/asset-owner";
import { getPortfolioSummary } from "@/lib/services/portfolio-service";
import { formatPercent } from "@/lib/format";
import { useDisplayCurrency } from "@/lib/currency-context";
import { useSettings } from "@/lib/settings-context";

/** Current valuation / P&L per household owner, side by side. */
export default function OwnerComparison({ assets }: { assets: Asset[] }) {
  const { usdKrw, money, signedMoney } = useDisplayCurrency();
  const { ownerName } = useSettings();

  const rows = ASSET_OWNERS.map((owner) => {
    const summary = getPortfolioSummary(
      assets.filter((asset) => getAssetOwner(asset) === owner),
      usdKrw
    );
    return { owner, summary };
  }).filter((row) => row.summary.totalValuation > 0 || row.summary.totalPrincipal > 0);

  if (rows.length < 2) return null;

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-card-dark">
      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">소유자별 성과</p>
      <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
        현재 보유 자산 기준 · 소유자별 평가금액과 원금 대비 손익
      </p>

      <div
        className={`mt-4 grid gap-4 sm:grid-cols-2 ${
          rows.length >= 4 ? "xl:grid-cols-4" : rows.length === 3 ? "xl:grid-cols-3" : ""
        }`}
      >
        {rows.map(({ owner, summary }) => {
          const isProfit = summary.totalProfit >= 0;
          return (
            <div
              key={owner}
              className="rounded-xl border border-border p-4 dark:border-border-dark"
            >
              <p className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                <span
                  aria-hidden
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: OWNER_COLOR[owner] }}
                />
                {ownerName(owner)}
              </p>
              <p className="mt-2 text-lg font-bold tracking-tight text-gray-900 dark:text-gray-100">
                {money(summary.totalValuation)}
              </p>
              <p className={`mt-0.5 text-xs font-medium ${isProfit ? "text-rise" : "text-fall"}`}>
                {signedMoney(summary.totalProfit)} (
                {formatPercent(summary.totalProfitRate)})
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
