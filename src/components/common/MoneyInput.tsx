"use client";

import { Currency } from "@/lib/models/asset";
import { formatCompactKRW } from "@/lib/format";

/**
 * Text input for money amounts that shows thousands separators while
 * typing and, for KRW, a live 억/만 readout. The parent still holds a
 * plain numeric string (digits, optional single "."), so existing
 * `Number(value)` parsing keeps working — only the display is formatted.
 */

function sanitize(input: string, allowDecimal: boolean): string {
  const noCommas = input.replace(/,/g, "");
  if (!allowDecimal) return noCommas.replace(/\D/g, "");
  const cleaned = noCommas.replace(/[^\d.]/g, "");
  const [intPart, ...rest] = cleaned.split(".");
  if (rest.length === 0) return intPart;
  return `${intPart}.${rest.join("").slice(0, 2)}`;
}

function withCommas(raw: string, allowDecimal: boolean): string {
  if (raw === "") return "";
  if (allowDecimal && raw.includes(".")) {
    const [intPart, decPart] = raw.split(".");
    const intFormatted = intPart ? Number(intPart).toLocaleString("en-US") : "0";
    return `${intFormatted}.${decPart ?? ""}`;
  }
  const digits = raw.replace(/\D/g, "");
  return digits ? Number(digits).toLocaleString("en-US") : "";
}

export default function MoneyInput({
  value,
  onChange,
  currency,
  className,
  placeholder,
  required,
  allowDecimal,
}: {
  value: string;
  onChange: (raw: string) => void;
  currency: Currency;
  className: string;
  placeholder?: string;
  required?: boolean;
  /** Defaults to true for USD (cents), false for KRW. */
  allowDecimal?: boolean;
}) {
  const decimals = allowDecimal ?? currency === "USD";
  const num = Number(value);
  const readout =
    currency === "KRW" && value !== "" && Number.isFinite(num) && num >= 10000
      ? formatCompactKRW(num)
      : null;

  return (
    <div className="relative">
      <input
        type="text"
        inputMode={decimals ? "decimal" : "numeric"}
        value={withCommas(value, decimals)}
        onChange={(event) => onChange(sanitize(event.target.value, decimals))}
        placeholder={placeholder}
        required={required}
        className={`w-full ${readout ? "pr-16" : ""} ${className}`}
      />
      {readout && (
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-medium text-gray-400 dark:text-gray-500">
          {readout}
        </span>
      )}
    </div>
  );
}
