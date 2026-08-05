"use client";

import { AssetFormValues } from "@/lib/models/asset-form";
import MoneyInput from "@/components/common/MoneyInput";
import { useT } from "@/lib/i18n/locale-context";
import { SetField } from "../use-asset-form";
import { inputClass, labelClass, labelTextClass, rowClass } from "../field-styles";

/**
 * The principal / current-value pair shared by 채권 · 연금 · 기타. Leaving
 * the current value blank means "unchanged since purchase", which the
 * placeholder spells out rather than defaulting to zero.
 */
export function AmountPairFields({
  values,
  setField,
  principalLabel,
  sameAsPrincipalHint,
}: {
  values: AssetFormValues;
  setField: SetField;
  principalLabel: string;
  sameAsPrincipalHint: string;
}) {
  const t = useT();
  return (
    <div className={rowClass}>
      <label className={labelClass}>
        <span className={labelTextClass}>{t(principalLabel)}</span>
        <MoneyInput
          value={values.purchasePrice}
          onChange={(raw) => setField("purchasePrice", raw)}
          currency={values.currency}
          placeholder="0"
          required
          className={inputClass}
        />
      </label>
      <label className={labelClass}>
        <span className={labelTextClass}>{t("현재 평가 금액 (선택)")}</span>
        <MoneyInput
          value={values.currentValue}
          onChange={(raw) => setField("currentValue", raw)}
          currency={values.currency}
          placeholder={t(sameAsPrincipalHint)}
          className={inputClass}
        />
      </label>
    </div>
  );
}

export function BondFields({
  values,
  setField,
}: {
  values: AssetFormValues;
  setField: SetField;
}) {
  const t = useT();
  return (
    <>
      <AmountPairFields
        values={values}
        setField={setField}
        principalLabel="매입 금액"
        sameAsPrincipalHint="미입력 시 매입 금액과 동일"
      />
      <div className={rowClass}>
        <label className={labelClass}>
          <span className={labelTextClass}>{t("표면금리 % (선택)")}</span>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={values.couponRate}
            onChange={(event) => setField("couponRate", event.target.value)}
            placeholder={t("예: 3.25")}
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          <span className={labelTextClass}>{t("만기일 (선택)")}</span>
          <input
            type="date"
            value={values.maturityDate}
            onChange={(event) => setField("maturityDate", event.target.value)}
            className={`${inputClass} [color-scheme:light] dark:[color-scheme:dark]`}
          />
        </label>
      </div>
    </>
  );
}

export function PensionFields({
  values,
  setField,
}: {
  values: AssetFormValues;
  setField: SetField;
}) {
  const t = useT();
  return (
    <>
      <label className={labelClass}>
        <span className={labelTextClass}>{t("계좌 유형 (선택)")}</span>
        <input
          type="text"
          value={values.accountType}
          onChange={(event) => setField("accountType", event.target.value)}
          placeholder={t("예: DC, IRP, 연금저축")}
          className={inputClass}
        />
      </label>
      <AmountPairFields
        values={values}
        setField={setField}
        principalLabel="납입 원금"
        sameAsPrincipalHint="미입력 시 납입 원금과 동일"
      />
    </>
  );
}

export function CustomFields({
  values,
  setField,
}: {
  values: AssetFormValues;
  setField: SetField;
}) {
  const t = useT();
  return (
    <>
      <label className={labelClass}>
        <span className={labelTextClass}>{t("카테고리 (선택)")}</span>
        <input
          type="text"
          value={values.category}
          onChange={(event) => setField("category", event.target.value)}
          placeholder={t("예: 부동산, 금, 암호화폐")}
          className={inputClass}
        />
      </label>
      <label className="flex items-center gap-2.5 rounded-xl bg-gray-50 px-4 py-3 dark:bg-white/5">
        <input
          type="checkbox"
          checked={values.isHome}
          onChange={(event) => setField("isHome", event.target.checked)}
          className="h-4 w-4 shrink-0 cursor-pointer rounded border-gray-300 text-gray-900 focus:ring-gray-900/20 dark:border-gray-600 dark:text-white"
        />
        <span className="text-xs text-gray-600 dark:text-gray-300">
          {t("실거주 주택(집)이에요")}
          <span className="ml-1 text-gray-400 dark:text-gray-500">
            {t("— 설정에서 목표 배분 계산 시 제외할 수 있어요")}
          </span>
        </span>
      </label>
      <AmountPairFields
        values={values}
        setField={setField}
        principalLabel="매입 금액"
        sameAsPrincipalHint="미입력 시 매입 금액과 동일"
      />
    </>
  );
}

export function CashFields({
  values,
  setField,
}: {
  values: AssetFormValues;
  setField: SetField;
}) {
  const t = useT();
  return (
    <label className={labelClass}>
      <span className={labelTextClass}>{t("금액")}</span>
      <MoneyInput
        value={values.balance}
        onChange={(raw) => setField("balance", raw)}
        currency={values.currency}
        placeholder="0"
        required
        className={inputClass}
      />
    </label>
  );
}
