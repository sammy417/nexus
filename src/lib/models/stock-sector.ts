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
 * Compose a display label from a base sector and an optional sub-sector,
 * e.g. "기술 (반도체)". `translate` localizes the base sector; the
 * sub-sector is user free text and stays as-is.
 */
export function formatSectorLabel(
  baseSector: string,
  subSector: string | undefined,
  translate: (sector: string) => string = (s) => s
): string {
  const base = translate(baseSector);
  const sub = subSector?.trim();
  return sub ? `${base} (${sub})` : base;
}

/**
 * Display label combining the (translated) base sector with the user's
 * free-text sub-sector, e.g. "기술 (반도체)". Grouping/coloring still use
 * `getStockSector` (base only) — this is presentation only.
 */
export function getStockSectorLabel(
  asset: StockAsset,
  translate: (sector: string) => string = (s) => s
): string {
  return formatSectorLabel(getStockSector(asset), asset.subSector?.trim() || undefined, translate);
}

/**
 * Mix a hex color toward white (amount > 0) or black (amount < 0). Used to
 * derive distinguishable shades of a base sector color for its sub-sectors.
 */
export function shadeHex(hex: string, amount: number): string {
  const m = hex.replace("#", "");
  const channels = [m.slice(0, 2), m.slice(2, 4), m.slice(4, 6)].map((c) => parseInt(c, 16));
  const target = amount >= 0 ? 255 : 0;
  const ratio = Math.min(Math.abs(amount), 1);
  return (
    "#" +
    channels
      .map((c) => Math.round(c + (target - c) * ratio).toString(16).padStart(2, "0"))
      .join("")
  );
}

// Shade offsets applied within a single base sector, first (largest) slice
// keeping the base color and the rest fanning out lighter/darker.
const SECTOR_SHADE_OFFSETS = [0, 0.24, -0.2, 0.44, -0.36, 0.62, -0.5];

/**
 * Assign a donut color to each sector slice. A base sector with a single
 * slice keeps its canonical color; when it splits into sub-sectors, the
 * slices get progressively lighter/darker shades of that base color so
 * they read as one family while staying distinguishable.
 */
export function assignSectorColors(entries: readonly { baseSector: string }[]): string[] {
  const counts = new Map<string, number>();
  for (const e of entries) counts.set(e.baseSector, (counts.get(e.baseSector) ?? 0) + 1);
  const seen = new Map<string, number>();
  return entries.map((e) => {
    const base = sectorColor(e.baseSector);
    if ((counts.get(e.baseSector) ?? 0) <= 1) return base;
    const idx = seen.get(e.baseSector) ?? 0;
    seen.set(e.baseSector, idx + 1);
    return shadeHex(base, SECTOR_SHADE_OFFSETS[idx % SECTOR_SHADE_OFFSETS.length]);
  });
}
