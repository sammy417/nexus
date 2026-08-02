"use client";

import { useMemo, useState } from "react";
import { Asset } from "@/lib/models/asset";
import { FOREIGN_CGT_EXEMPTION_KRW, FOREIGN_CGT_RATE } from "@/lib/models/tax";
import { getCapitalGainsSummary, getForeignStockLots } from "@/lib/services/tax-service";
import MoneyInput from "@/components/common/MoneyInput";
import { useDisplayCurrency } from "@/lib/currency-context";
import { useT } from "@/lib/i18n/locale-context";

const HARVEST_COLOR = "#3182F6";

const inputClass =
  "rounded-xl bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-300 focus:ring-2 focus:ring-gray-900/10 dark:bg-white/5 dark:text-gray-100 dark:placeholder:text-gray-600 dark:focus:ring-white/10";

type Sign = "GAIN" | "LOSS";

/**
 * 해외주식 양도세 시뮬레이터. 연 250만원 기본공제는 "올해 실현손익 전체
 * 합계"에 적용되므로, 정확히 계산하려면 이미 매도해서 확정된 올해 손익을
 * 입력받아야 한다 — 보유 중인 종목의 평가손익만으로는(전량 미실현) 실제
 * 세액과 무관할 수 있다. 아래에서 실현손익을 입력받고, 보유 종목 체크박스로
 * "추가로 이만큼 더 판다면"을 얹어 시뮬레이션한다.
 */
export default function CapitalGainsCard({ assets }: { assets: Asset[] }) {
  const { usdKrw, money } = useDisplayCurrency();
  const t = useT();

  const lots = useMemo(() => getForeignStockLots(assets, usdKrw), [assets, usdKrw]);
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [realizedSign, setRealizedSign] = useState<Sign>("GAIN");
  const [realizedMagnitude, setRealizedMagnitude] = useState("");

  const realizedSoFarKrw = (Number(realizedMagnitude) || 0) * (realizedSign === "LOSS" ? -1 : 1);

  const header = (
    <>
      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
        {t("해외주식 양도소득세 시뮬레이터")}
      </p>
      <p className="mt-0.5 text-[11px] leading-relaxed text-gray-400 dark:text-gray-500">
        {t(
          "연 {exemption} 기본공제는 올해 실현손익 전체 합계에 적용되고 이월되지 않습니다. 이미 매도해서 확정된 손익을 입력하고, 보유 종목을 선택해 '추가로 더 판다면'을 함께 시뮬레이션하세요 — 확정 세액이 아닌 추정치입니다.",
          { exemption: money(FOREIGN_CGT_EXEMPTION_KRW) }
        )}
      </p>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {t("올해 실현손익 (이미 매도해서 확정된 금액, 세전)")}
          </span>
          <div className="flex gap-2">
            <div className="flex gap-1 rounded-lg bg-gray-50 p-0.5 dark:bg-white/5">
              {(
                [
                  { value: "GAIN" as const, label: "이익" },
                  { value: "LOSS" as const, label: "손실" },
                ]
              ).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRealizedSign(option.value)}
                  className={`rounded-md px-3 py-2 text-xs font-semibold transition-colors ${
                    realizedSign === option.value
                      ? "bg-white text-gray-900 shadow-sm dark:bg-white/15 dark:text-gray-100"
                      : "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                  }`}
                >
                  {t(option.label)}
                </button>
              ))}
            </div>
            <MoneyInput
              value={realizedMagnitude}
              onChange={setRealizedMagnitude}
              currency="KRW"
              placeholder="0"
              className={`w-40 ${inputClass}`}
            />
          </div>
        </div>
      </div>
    </>
  );

  if (lots.length === 0) {
    const summary = getCapitalGainsSummary(realizedSoFarKrw, []);
    return (
      <section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-card-dark">
        {header}
        {realizedSoFarKrw !== 0 ? (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Metric
              label={t("올해 실현손익")}
              value={money(summary.realizedSoFarKrw)}
              tone={summary.realizedSoFarKrw >= 0 ? "rise" : "fall"}
            />
            <Metric label={t("과세 대상 차익")} value={money(summary.taxableGainKrw)} />
            <Metric
              label={t("예상 세액 ({rate}%)", { rate: (FOREIGN_CGT_RATE * 100).toFixed(0) })}
              value={money(summary.estimatedTaxKrw)}
              tone="fall"
            />
          </div>
        ) : (
          <p className="py-10 text-center text-sm text-gray-400 dark:text-gray-500">
            {t("보유한 해외주식이 없어 추가 매도를 시뮬레이션할 수 없습니다.")}
          </p>
        )}
      </section>
    );
  }

  const sorted = [...lots].sort((a, b) => a.profitKrw - b.profitKrw);
  const additionalProfits = sorted
    .filter((lot) => !excluded.has(lot.asset.id))
    .map((lot) => lot.profitKrw);
  const summary = getCapitalGainsSummary(realizedSoFarKrw, additionalProfits);

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
      {header}

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Metric
          label={t("올해 실현손익")}
          value={money(summary.realizedSoFarKrw)}
          tone={summary.realizedSoFarKrw >= 0 ? "rise" : "fall"}
        />
        <Metric
          label={t("선택 종목 추가 매도 시")}
          value={money(summary.additionalGainKrw)}
          tone={summary.additionalGainKrw >= 0 ? "rise" : "fall"}
        />
        <Metric
          label={t("합계 손익")}
          value={money(summary.totalGainKrw)}
          tone={summary.totalGainKrw >= 0 ? "rise" : "fall"}
        />
        <Metric label={t("남은 기본공제")} value={money(summary.exemptionRemainingKrw)} />
        <Metric label={t("과세 대상 차익 (합계)")} value={money(summary.taxableGainKrw)} />
        <Metric
          label={t("예상 세액 ({rate}%, 합계)", { rate: (FOREIGN_CGT_RATE * 100).toFixed(0) })}
          value={money(summary.estimatedTaxKrw)}
          tone="fall"
        />
      </div>

      {summary.taxOnRealizedOnlyKrw > 0 && (
        <p className="mt-3 text-[11px] leading-relaxed text-gray-400 dark:text-gray-500">
          {t(
            "추가로 아무것도 팔지 않아도 올해 실현손익만으로 이미 약 {tax}의 세금이 예상됩니다. 선택한 종목을 추가로 매도하면 세액이 약 {delta} 더 늘어납니다.",
            { tax: money(summary.taxOnRealizedOnlyKrw), delta: money(summary.additionalTaxKrw) }
          )}
        </p>
      )}

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
