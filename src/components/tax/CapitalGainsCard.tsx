"use client";

import { useMemo, useState } from "react";
import { Asset } from "@/lib/models/asset";
import { FOREIGN_CGT_EXEMPTION_KRW, FOREIGN_CGT_RATE } from "@/lib/models/tax";
import { getCapitalGainsSummary, getForeignStockLots } from "@/lib/services/tax-service";
import { useDisplayCurrency } from "@/lib/currency-context";
import { useT } from "@/lib/i18n/locale-context";

const HARVEST_COLOR = "#3182F6";

/**
 * "지금 매도한다면" 기준의 해외주식 양도세 시뮬레이터. 실제 과세는 실현
 * 손익(매도 시점) 기준이라, 보유 중인 평가손익으로 계산하는 가상 시나리오
 * 일 뿐 확정 세액이 아니다 — 카드 전체에 이 점을 명시한다.
 */
export default function CapitalGainsCard({ assets }: { assets: Asset[] }) {
  const { usdKrw, money } = useDisplayCurrency();
  const t = useT();

  const lots = useMemo(() => getForeignStockLots(assets, usdKrw), [assets, usdKrw]);
  const [excluded, setExcluded] = useState<Set<string>>(new Set());

  if (lots.length === 0) {
    return (
      <section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-card-dark">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {t("해외주식 양도소득세 시뮬레이터")}
        </p>
        <p className="py-10 text-center text-sm text-gray-400 dark:text-gray-500">
          {t("보유한 해외주식이 없어 시뮬레이션할 수 없습니다.")}
        </p>
      </section>
    );
  }

  const sorted = [...lots].sort((a, b) => a.profitKrw - b.profitKrw);
  const selectedProfits = sorted
    .filter((lot) => !excluded.has(lot.asset.id))
    .map((lot) => lot.profitKrw);
  const summary = getCapitalGainsSummary(selectedProfits);

  function toggle(id: string) {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-card-dark">
      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
        {t("해외주식 양도소득세 시뮬레이터")}
      </p>
      <p className="mt-0.5 text-[11px] leading-relaxed text-gray-400 dark:text-gray-500">
        {t(
          "선택한 종목을 오늘 전량 매도한다면 — 현재 평가손익 기준의 가상 시나리오이며 확정 세액이 아닙니다. 연 {exemption} 기본공제는 해당 연도 실현손익에 적용되고 이월되지 않습니다.",
          { exemption: money(FOREIGN_CGT_EXEMPTION_KRW) }
        )}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric
          label={t("순매매차익 (선택)")}
          value={money(summary.netGainKrw)}
          tone={summary.netGainKrw >= 0 ? "rise" : "fall"}
        />
        <Metric label={t("남은 기본공제")} value={money(summary.exemptionRemainingKrw)} />
        <Metric label={t("과세 대상 차익")} value={money(summary.taxableGainKrw)} />
        <Metric
          label={t("예상 세액 ({rate}%)", { rate: (FOREIGN_CGT_RATE * 100).toFixed(0) })}
          value={money(summary.estimatedTaxKrw)}
          tone="fall"
        />
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs font-medium text-gray-400 dark:border-border-dark dark:text-gray-500">
              <th className="w-8 py-2" />
              <th className="py-2">{t("종목")}</th>
              <th className="py-2 text-right">{t("평가 금액")}</th>
              <th className="py-2 text-right">{t("평가 손익")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-white/5">
            {sorted.map((lot) => {
              const isOut = excluded.has(lot.asset.id);
              const isLoss = lot.profitKrw < 0;
              return (
                <tr key={lot.asset.id} className={isOut ? "opacity-40" : ""}>
                  <td className="py-2.5">
                    <input
                      type="checkbox"
                      checked={!isOut}
                      onChange={() => toggle(lot.asset.id)}
                      aria-label={t("{name} 시뮬레이션에 포함", { name: lot.asset.name })}
                      className="h-4 w-4 cursor-pointer rounded border-gray-300 text-gray-900 focus:ring-gray-900/20 dark:border-gray-600 dark:text-white"
                    />
                  </td>
                  <td className="py-2.5 pr-3">
                    <p className="font-medium text-gray-900 dark:text-gray-100">{lot.asset.name}</p>
                    {isLoss && !isOut && (
                      <span
                        className="mt-0.5 inline-block rounded px-1 py-0.5 text-[10px] font-semibold"
                        style={{ color: HARVEST_COLOR, backgroundColor: `${HARVEST_COLOR}1f` }}
                      >
                        {t("손실 확정 후보")}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 text-right text-gray-700 dark:text-gray-300">
                    {money(lot.valuationKrw)}
                  </td>
                  <td
                    className={`py-2.5 text-right font-medium ${
                      lot.profitKrw >= 0 ? "text-rise" : "text-fall"
                    }`}
                  >
                    {lot.profitKrw >= 0 ? "+" : ""}
                    {money(lot.profitKrw)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "rise" | "fall";
}) {
  return (
    <div className="rounded-xl border border-border p-3 dark:border-border-dark">
      <p className="text-[11px] text-gray-400 dark:text-gray-500">{label}</p>
      <p
        className={`mt-0.5 truncate text-sm font-bold [font-variant-numeric:tabular-nums] ${
          tone === "rise" ? "text-rise" : tone === "fall" ? "text-fall" : "text-gray-900 dark:text-gray-100"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
