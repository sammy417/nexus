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
