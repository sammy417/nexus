"use client";

import { AssetFormValues } from "@/lib/models/asset-form";
import { ASSET_TYPE_LABEL, ASSET_TYPES } from "@/lib/models/asset-types";
import { ASSET_OWNERS } from "@/lib/models/asset-owner";
import { AssetType, Currency } from "@/lib/models/asset";
import { useSettings } from "@/lib/settings-context";
import { useT } from "@/lib/i18n/locale-context";
import { SetField } from "../use-asset-form";
import { inputClass, labelClass, labelTextClass } from "../field-styles";

/** Shared segmented-control button, used by the currency and owner pickers. */
function SegmentButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1 rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
        active
          ? "bg-white text-gray-900 shadow-sm dark:bg-white/15 dark:text-gray-100"
          : "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
      }`}
    >
      {children}
    </button>
  );
}

function SegmentRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className={labelTextClass}>{label}</span>
      <div className="flex gap-1 rounded-lg bg-gray-50 p-0.5 dark:bg-white/5">{children}</div>
    </div>
  );
}

/** Asset type is fixed once saved — changing it would rewrite the stored shape. */
export function TypePicker({
  type,
  disabled,
  onChange,
}: {
  type: AssetType;
  disabled: boolean;
  onChange: (type: AssetType) => void;
}) {
  const t = useT();
  return (
    <div className="grid grid-cols-5 gap-2">
      {ASSET_TYPES.map((option) => (
        <button
          key={option}
          type="button"
          disabled={disabled}
          onClick={() => onChange(option)}
          className={`rounded-xl py-2.5 text-sm font-semibold transition-colors ${
            type === option
              ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
              : "bg-gray-50 text-gray-400 dark:bg-white/5 dark:text-gray-500"
          } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
        >
          {t(ASSET_TYPE_LABEL[option])}
        </button>
      ))}
    </div>
  );
}

export function CurrencyPicker({
  currency,
  onChange,
}: {
  currency: Currency;
  onChange: (currency: Currency) => void;
}) {
  const t = useT();
  return (
    <SegmentRow label={t("표시 금액 통화")}>
      {(["KRW", "USD"] as Currency[]).map((option) => (
        <SegmentButton
          key={option}
          active={currency === option}
          onClick={() => onChange(option)}
        >
          {option === "KRW" ? t("₩ 원화") : t("$ 달러")}
        </SegmentButton>
      ))}
    </SegmentRow>
  );
}

export function OwnerPicker({
  values,
  setField,
}: {
  values: AssetFormValues;
  setField: SetField;
}) {
  const { ownerName, ownerColor } = useSettings();
  const t = useT();
  return (
    <SegmentRow label={t("소유자")}>
      {ASSET_OWNERS.map((option) => (
        <SegmentButton
          key={option}
          active={values.owner === option}
          onClick={() => setField("owner", option)}
        >
          <span
            aria-hidden
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: ownerColor(option) }}
          />
          {ownerName(option)}
        </SegmentButton>
      ))}
    </SegmentRow>
  );
}

const NAME_PLACEHOLDER: Record<AssetType, string> = {
  STOCK: "예: 삼성전자",
  BOND: "예: 국고채 3년",
  PENSION: "예: IRP 계좌 (미래에셋)",
  CUSTOM: "예: 자가 아파트, 금 현물",
  CASH: "예: 입출금 통장",
};

export function NameField({
  values,
  setField,
}: {
  values: AssetFormValues;
  setField: SetField;
}) {
  const t = useT();
  return (
    <label className={labelClass}>
      <span className={labelTextClass}>
        {values.type === "STOCK" ? t("종목명") : t("자산명")}
      </span>
      <input
        type="text"
        value={values.name}
        onChange={(event) => setField("name", event.target.value)}
        placeholder={t(NAME_PLACEHOLDER[values.type])}
        required
        className={inputClass}
      />
    </label>
  );
}
