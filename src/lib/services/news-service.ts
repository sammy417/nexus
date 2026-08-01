import "server-only";
import { NewsItem } from "@/lib/models/news";

/**
 * Recent Korean economic/investment headlines, aggregated from a handful of
 * major outlets' public RSS feeds. Everything is best-effort and read-only:
 * feeds are fetched in parallel, items older than 24h are dropped, near-
 * duplicate headlines are collapsed, and the rest are sorted newest-first.
 *
 * `NEWS_API_BASE` overrides the upstream origin (used by tests to point at a
 * local mock; the mock routes by the feed's path). A feed that fails or times
 * out is skipped and reported in `failedSources` — the page degrades to an
 * empty/partial state rather than erroring.
 */

const NEWS_TTL_MS = 15 * 60 * 1000;
const WINDOW_MS = 24 * 60 * 60 * 1000;
const MAX_ITEMS = 40;
const SUMMARY_MAX = 160;

interface Feed {
  source: string;
  url: string;
}

// 국내 주요 경제·투자 뉴스 RSS (증권·경제 위주).
const FEEDS: Feed[] = [
  { source: "연합뉴스 경제", url: "https://www.yna.co.kr/rss/economy.xml" },
  { source: "연합뉴스 증권", url: "https://www.yna.co.kr/rss/market.xml" },
  { source: "한국경제 경제", url: "https://www.hankyung.com/feed/economy" },
  { source: "한국경제 증권", url: "https://www.hankyung.com/feed/finance" },
  { source: "매일경제 증권", url: "https://www.mk.co.kr/rss/50200011/" },
  { source: "이데일리 증권", url: "https://rss.edaily.co.kr/stock_news.xml" },
];

export interface NewsResult {
  items: NewsItem[];
  /** All outlets we attempt to read. */
  sources: string[];
  /** Outlets that failed this fetch (timeout, error, unreachable). */
  failedSources: string[];
}

function decodeText(raw: string): string {
  return raw
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function firstTag(block: string, name: string): string | null {
  const match = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, "i"));
  return match ? match[1] : null;
}

/** Normalized title key for de-duplicating the same story across outlets. */
function titleKey(title: string): string {
  return title.toLowerCase().replace(/[\s\p{P}]/gu, "");
}

function parseFeed(xml: string, source: string): NewsItem[] {
  const items: NewsItem[] = [];
  const blocks = xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];
  for (const block of blocks) {
    const title = decodeText(firstTag(block, "title") ?? "");
    const link = decodeText(firstTag(block, "link") ?? "");
    const dateStr = firstTag(block, "pubDate") ?? firstTag(block, "dc:date") ?? "";
    const ts = Date.parse(dateStr);
    if (!title || !/^https?:\/\//.test(link) || Number.isNaN(ts)) continue;
    const summary = decodeText(firstTag(block, "description") ?? "").slice(0, SUMMARY_MAX);
    items.push({
      id: link,
      title,
      url: link,
      source,
      publishedAt: new Date(ts).toISOString(),
      summary: summary || undefined,
    });
  }
  return items;
}

function feedUrl(url: string): string {
  const base = process.env.NEWS_API_BASE;
  if (!base) return url;
  const parsed = new URL(url);
  return `${base}${parsed.pathname}${parsed.search}`;
}

async function fetchFeed(feed: Feed): Promise<NewsItem[]> {
  const response = await fetch(feedUrl(feed.url), {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; nexus-portfolio)" },
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`${feed.source} upstream ${response.status}`);
  return parseFeed(await response.text(), feed.source);
}

const globalForNews = globalThis as unknown as {
  __nexusNewsCache?: { fetchedAt: number; result: NewsResult };
};

export async function getNews(): Promise<NewsResult> {
  const cached = globalForNews.__nexusNewsCache;
  if (cached && Date.now() - cached.fetchedAt < NEWS_TTL_MS) return cached.result;

  const settled = await Promise.allSettled(FEEDS.map(fetchFeed));
  const failedSources: string[] = [];
  const all: NewsItem[] = [];
  settled.forEach((outcome, i) => {
    if (outcome.status === "fulfilled") all.push(...outcome.value);
    else failedSources.push(FEEDS[i].source);
  });

  const cutoff = Date.now() - WINDOW_MS;
  const seen = new Set<string>();
  const items = all
    .filter((item) => Date.parse(item.publishedAt) >= cutoff)
    .filter((item) => {
      const key = titleKey(item.title);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, MAX_ITEMS);

  const result: NewsResult = {
    items,
    sources: FEEDS.map((f) => f.source),
    failedSources,
  };

  // Don't cache a total wipeout (every feed failed) — retry on the next hit.
  if (failedSources.length < FEEDS.length) {
    globalForNews.__nexusNewsCache = { fetchedAt: Date.now(), result };
  }
  return result;
}
