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
