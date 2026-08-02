/**
 * A single news headline shown on the 뉴스 page. Sourced from external
 * Korean economic/investment RSS feeds (see `news-service.ts`), so this is a
 * read-only, display-only model — nothing is persisted.
 */
export interface NewsItem {
  /** Stable id (the article URL). */
  id: string;
  title: string;
  url: string;
  /** Human-readable outlet name, e.g. "연합뉴스 경제". */
  source: string;
  /** ISO 8601 publish timestamp. */
  publishedAt: string;
  /** Short plain-text excerpt, when the feed provides one. */
  summary?: string;
}

/**
 * Stable accent color per outlet (mid-tones that read on both light and
 * dark surfaces, same palette family as the sector/category colors) — gives
 * the source badge a bit of life instead of flat gray. Falls back to a
 * neutral gray for any outlet not in the list (e.g. a future feed change).
 */
const NEWS_SOURCE_COLOR: Record<string, string> = {
  "연합뉴스 증권": "#3182F6",
  "한국경제 증권": "#1baf7a",
  "한국경제 IT": "#5c7cfa",
  "매일경제 증권": "#c98500",
  "이데일리 증권": "#c9548a",
  "전자신문 반도체": "#8a63d2",
};
const NEWS_SOURCE_FALLBACK_COLOR = "#8a95a3";

export function newsSourceColor(source: string): string {
  return NEWS_SOURCE_COLOR[source] ?? NEWS_SOURCE_FALLBACK_COLOR;
}
