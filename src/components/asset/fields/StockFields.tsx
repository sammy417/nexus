"use client";

import { Asset } from "@/lib/models/asset";
import { AssetFormValues } from "@/lib/models/asset-form";
import { STOCK_SECTORS } from "@/lib/models/stock-sector";
import { formatKRW } from "@/lib/format";
import MoneyInput from "@/components/common/MoneyInput";
import { useT } from "@/lib/i18n/locale-context";
import { SetField } from "../use-asset-form";
import { hintTextClass, inputClass, labelClass, labelTextClass, rowClass } from "../field-styles";

/**
 * 현재가 is deliberately absent: it's resolved at save time from the ticker
 * (or the 평단가 fallback), so a typed price could never go stale on screen.
 */
export default function StockFields({
  values,
  setField,
  editingAsset,
}: {
  values: AssetFormValues;
  setField: SetField;
  editingAsset: Asset | null;
}) {
  const t = useT();
  const stored = editingAsset?.type === "STOCK" ? editingAsset : null;

  return (
    <>
      <div className={rowClass}>
        <label className={labelClass}>
          <span className={labelTextClass}>{t("보유 수량")}</span>
          <input
            type="number"
            inputMode="numeric"
            min="0"
            value={values.quantity}
            onChange={(event) => setField("quantity", event.target.value)}
            placeholder="0"
            required
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          <span className={labelTextClass}>{t("티커 (선택)")}</span>
          <input
            type="text"
            value={values.ticker}
            onChange={(event) => setField("ticker", event.target.value)}
            placeholder={t("예: 005930, AAPL")}
            className={inputClass}
          />
        </label>
      </div>

      <div className={rowClass}>
        <label className={labelClass}>
          <span className={labelTextClass}>{t("시장 (선택)")}</span>
          <input
            type="text"
            value={values.market}
            onChange={(event) => setField("market", event.target.value)}
            placeholder={t("예: KOSPI, KOSDAQ, NASDAQ")}
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          <span className={labelTextClass}>{t("평단가 (선택)")}</span>
          <MoneyInput
            value={values.avgPrice}
            onChange={(raw) => setField("avgPrice", raw)}
            currency={values.currency}
            placeholder="0"
            className={inputClass}
          />
        </label>
      </div>

      <div className={rowClass}>
        <label className={labelClass}>
          <span className={labelTextClass}>{t("섹터 (선택)")}</span>
          <select
            value={values.sector}
            onChange={(event) => setField("sector", event.target.value)}
            className={`${inputClass} appearance-none`}
          >
            <option value="">{t("자동 조회 (티커 기준)")}</option>
            {STOCK_SECTORS.map((sector) => (
              <option key={sector} value={sector}>
                {t(sector)}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          <span className={labelTextClass}>{t("세부 섹터 (선택)")}</span>
          <input
            type="text"
            value={values.subSector}
            onChange={(event) => setField("subSector", event.target.value)}
            placeholder={t("예: 반도체, AI SW")}
            className={inputClass}
          />
        </label>
      </div>

      <p className={hintTextClass}>
        {t(
          "현재가는 입력하지 않습니다 — 저장 시 티커로 자동 조회해 선택한 통화로 저장합니다 (국내 6자리 코드·미국 티커 지원). 티커가 없거나 조회에 실패하면 평단가로 대신 계산합니다."
        )}
        {stored && (
          <>
            {" "}
            {t("현재 저장된 현재가:")}{" "}
            {(stored.currency ?? "KRW") === "USD"
              ? `$${stored.currentPrice.toLocaleString("en-US")}`
              : formatKRW(stored.currentPrice)}
          </>
        )}
      </p>
    </>
  );
}
