import { Currency } from "@/lib/models/asset";

export function formatKRW(value: number): string {
  return `₩${Math.round(value).toLocaleString("ko-KR")}`;
}

export function formatSigned(value: number): string {
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}₩${Math.round(Math.abs(value)).toLocaleString("ko-KR")}`;
}

export function formatPercent(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

/** Axis-tick friendly Korean units: 4.05억, 3,200만, 9,000. */
export function formatCompactKRW(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1e8) {
    const eok = value / 1e8;
    return `${Number.isInteger(eok) ? eok : eok.toFixed(2)}억`;
  }
  if (abs >= 1e4) {
    return `${Math.round(value / 1e4).toLocaleString("ko-KR")}만`;
  }
  return Math.round(value).toLocaleString("ko-KR");
}

function toDisplay(valueKrw: number, currency: Currency, usdKrw: number): number {
  return currency === "USD" ? valueKrw / usdKrw : valueKrw;
}

function formatUSD(value: number): string {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** A KRW-base amount rendered in the chosen display currency. */
export function formatMoney(valueKrw: number, currency: Currency, usdKrw: number): string {
  const value = toDisplay(valueKrw, currency, usdKrw);
  return currency === "USD" ? formatUSD(value) : formatKRW(value);
}

export function formatSignedMoney(valueKrw: number, currency: Currency, usdKrw: number): string {
  const value = toDisplay(valueKrw, currency, usdKrw);
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  const abs = Math.abs(value);
  return currency === "USD" ? `${sign}${formatUSD(abs)}` : `${sign}${formatKRW(abs)}`;
}

/** Compact form for chart axis ticks in the display currency: 4,050만 / $28.5K. */
export function formatCompactMoney(valueKrw: number, currency: Currency, usdKrw: number): string {
  if (currency === "KRW") return formatCompactKRW(valueKrw);
  const value = toDisplay(valueKrw, currency, usdKrw);
  const abs = Math.abs(value);
  if (abs >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
  return `$${Math.round(value).toLocaleString("en-US")}`;
}
