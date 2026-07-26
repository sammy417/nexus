import { StockAsset } from "./asset";

/**
 * Canonical sectors for the stock-analysis view, stored as the Korean
 * label string on the asset. The UI translates these via i18n keys, so the
 * labels below double as translation keys.
 */
export const STOCK_SECTORS = [
  "기술",
  "금융",
  "헬스케어",
  "소비재",
  "산업재",
  "에너지",
  "소재",
  "통신",
  "유틸리티",
  "부동산",
  "ETF·펀드",
  "기타",
] as const;

export type StockSector = (typeof STOCK_SECTORS)[number];

/** Shown for stocks with no sector set (and not a real, selectable option). */
export const UNCLASSIFIED_SECTOR = "미분류";

/**
 * Distinct hex colors per sector — mid-tones that read on both light and
 * dark surfaces (same intent as the portfolio category palette).
 */
export const SECTOR_COLOR: Record<string, string> = {
  기술: "#3182F6",
  금융: "#1baf7a",
  헬스케어: "#c9548a",
  소비재: "#c98500",
  산업재: "#8a63d2",
  에너지: "#e0632f",
  소재: "#b9722e",
  통신: "#2aa9c0",
  유틸리티: "#6b8e23",
  부동산: "#d17a9e",
  "ETF·펀드": "#5c7cfa",
  기타: "#8a95a3",
  [UNCLASSIFIED_SECTOR]: "#b0b8c1",
};

export function sectorColor(sector: string): string {
  return SECTOR_COLOR[sector] ?? SECTOR_COLOR[UNCLASSIFIED_SECTOR];
}

/** Yahoo `assetProfile.sector` (English) → canonical Korean label. */
const YAHOO_SECTOR_MAP: Record<string, StockSector> = {
  Technology: "기술",
  "Financial Services": "금융",
  Financial: "금융",
  Healthcare: "헬스케어",
  "Consumer Cyclical": "소비재",
  "Consumer Defensive": "소비재",
  Industrials: "산업재",
  Energy: "에너지",
  "Basic Materials": "소재",
  "Communication Services": "통신",
  Utilities: "유틸리티",
  "Real Estate": "부동산",
};

/**
 * Coerce an arbitrary sector string (manual entry or Yahoo English) into a
 * stored value: a canonical Korean label when recognized, else the trimmed
 * input, else undefined.
 */
export function normalizeSector(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  if ((STOCK_SECTORS as readonly string[]).includes(trimmed)) return trimmed;
  if (YAHOO_SECTOR_MAP[trimmed]) return YAHOO_SECTOR_MAP[trimmed];
  return trimmed;
}

/** The sector to display/group a stock by ("미분류" when unset). */
export function getStockSector(asset: StockAsset): string {
  return asset.sector?.trim() || UNCLASSIFIED_SECTOR;
}

/**
 * Display label combining the (translated) base sector with the user's
 * free-text sub-sector, e.g. "기술 (반도체)". Grouping/coloring still use
 * `getStockSector` (base only) — this is presentation only. `translate`
 * localizes the base sector; the sub-sector is user text and stays as-is.
 */
export function getStockSectorLabel(
  asset: StockAsset,
  translate: (sector: string) => string = (s) => s
): string {
  const base = translate(getStockSector(asset));
  const sub = asset.subSector?.trim();
  return sub ? `${base} (${sub})` : base;
}
