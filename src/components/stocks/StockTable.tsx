"use client";

import { formatPercent } from "@/lib/format";
import { useDisplayCurrency } from "@/lib/currency-context";
import { useT } from "@/lib/i18n/locale-context";
import { useAssetModal } from "@/lib/asset-modal-context";
import { sectorColor } from "@/lib/models/stock-sector";
import { hexWithAlpha } from "@/lib/models/asset-owner";
import type { Contribution } from "@/lib/services/stock-analysis-service";

const headerCellClass = "px-4 py-3 text-xs font-medium text-gray-400 dark:text-gray-500";

/** Per-stock table: sector, region, weight, valuation, P&L, contribution. */
export default function StockTable({ rows }: { rows: Contribution[] }) {
  const { money, signedMoney } = useDisplayCurrency();
  const { openEditModal } = useAssetModal();
  const t = useT();

  return (
    <div className="overflow-x-auto rounded-2xl bg-white shadow-sm dark:bg-card-dark">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b border-border text-left dark:border-border-dark">
            <th className={headerCellClass}>{t("종목")}</th>
            <th className={headerCellClass}>{t("섹터")}</th>
            <th className={`${headerCellClass} text-right`}>{t("비중")}</th>
            <th className={`${headerCellClass} text-right`}>{t("평가 금액")}</th>
            <th className={`${headerCellClass} text-right`}>{t("평가 손익")}</th>
            <th className={`${headerCellClass} text-right`}>{t("손익 기여")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 dark:divide-white/5">
          {rows.map(({ holding, share }) => {
            const isProfit = holding.profit >= 0;
            const color = sectorColor(holding.sector);
            return (
              <tr
                key={holding.asset.id}
                onClick={() => openEditModal(holding.asset)}
                className="group cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-white/5"
              >
                <td className="px-4 py-3.5">
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {holding.asset.name}
                    {holding.asset.currency === "USD" && (
                      <span className="ml-1.5 rounded bg-gray-100 px-1 py-0.5 text-[10px] font-semibold text-gray-500 dark:bg-white/10 dark:text-gray-400">
                        USD
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                    {[holding.asset.market, holding.asset.ticker].filter(Boolean).join(" · ") ||
                      (holding.region === "KR" ? t("국내") : t("해외"))}
                  </p>
                </td>
                <td className="whitespace-nowrap px-4 py-3.5">
                  <span
                    className="rounded px-1.5 py-0.5 text-[11px] font-semibold"
                    style={{ color, backgroundColor: hexWithAlpha(color, 0.12) }}
                  >
                    {t(holding.sector)}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-right text-gray-700 [font-variant-numeric:tabular-nums] dark:text-gray-300">
                  {holding.weight.toFixed(1)}%
                </td>
                <td className="px-4 py-3.5 text-right font-medium text-gray-900 dark:text-gray-100">
                  {money(holding.valuation)}
                </td>
                <td className="px-4 py-3.5 text-right">
                  <span className={`font-medium ${isProfit ? "text-rise" : "text-fall"}`}>
                    {signedMoney(holding.profit)} ({formatPercent(holding.profitRate)})
                  </span>
                </td>
                <td
                  className={`px-4 py-3.5 text-right [font-variant-numeric:tabular-nums] ${
                    share >= 0 ? "text-rise" : "text-fall"
                  }`}
                >
                  {share > 0 ? "+" : ""}
                  {share.toFixed(1)}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
