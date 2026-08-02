import "server-only";
import { NewsItem } from "@/lib/models/news";
import { UNCLASSIFIED_SECTOR } from "@/lib/models/stock-sector";
import { getAssetRepository } from "@/lib/repositories";
import { DEFAULT_USD_KRW } from "./portfolio-service";
import { fetchUsdKrwRate } from "./quote-service";
import { getSectorAllocation, getStockHoldings } from "./stock-analysis-service";

/**
 * Recent Korean economic/investment headlines, curated to the user's actual
 * holdings rather than general economic news. Feeds skew toward markets/IT
 * outlets, and results are additionally filtered to stories mentioning:
 *   - an evergreen 반도체/AI anchor (the sectors the user asked to center on),
 *   - the user's other heavily-weighted sectors (>= HEAVY_WEIGHT_PCT of the
 *     stock portfolio), and
 *   - the user's heavily-held individual stocks (by name/ticker/alias).
 * This naturally excludes generic macro coverage (rates, FX, GDP, ...) that
 * doesn't touch anything the user is actually invested in.
 *
 * Everything is best-effort and read-only: feeds are fetched in parallel,
 * items older than 24h are dropped, near-duplicate headlines are collapsed,
 * and the rest are sorted newest-first. `NEWS_API_BASE` overrides the
 * upstream origin (used by tests to point at a local mock). A feed that
 * fails or times out is skipped and reported in `failedSources`.
 */

const NEWS_TTL_MS = 15 * 60 * 1000;
const WINDOW_MS = 24 * 60 * 60 * 1000;
/** Raw dedup pool kept before relevance filtering (generous headroom). */
const RAW_POOL_CAP = 300;
/** Final pool size after filtering — what the page can page through. */
const MAX_ITEMS = 40;
const SUMMARY_MAX = 160;

/** Sector weight (percent of the stock portfolio) that counts as "heavily held". */
const HEAVY_WEIGHT_PCT = 8;
/** Fallback count of top holdings when nothing clears the weight threshold. */
const TOP_N_FALLBACK = 5;

interface Feed {
  source: string;
  url: string;
}

// 국내 주요 경제·투자 뉴스 RSS — 시황(증권)·IT/반도체 위주로 구성하고,
// 일반 경제 개괄 피드는 빼서 관련도 필터와 함께 종목·섹터 중심을 유지한다.
const FEEDS: Feed[] = [
  { source: "연합뉴스 증권", url: "https://www.yna.co.kr/rss/market.xml" },
  { source: "한국경제 증권", url: "https://www.hankyung.com/feed/finance" },
  { source: "한국경제 IT", url: "https://www.hankyung.com/feed/it" },
  { source: "매일경제 증권", url: "https://www.mk.co.kr/rss/50200011/" },
  { source: "이데일리 증권", url: "https://rss.edaily.co.kr/stock_news.xml" },
  { source: "전자신문 반도체", url: "https://rss.etnews.com/Section901.xml" },
];

// 사용자가 보유하지 않아도 항상 관심 대상인 앵커 섹터(반도체·AI) — 사용자가
// 명시적으로 "반도체, AI 섹터 등"을 중심으로 요청했기 때문에 상시 포함한다.
const ANCHOR_KEYWORDS = ["반도체", "AI", "인공지능", "AI칩", "파운드리", "HBM", "GPU", "D램", "낸드"];

// 그룹핑에는 쓰지 않는(비관련도) 섹터 라벨 — 키워드로 넣으면 과매칭된다.
const SECTOR_KEYWORD_BLOCKLIST = new Set(["기타", UNCLASSIFIED_SECTOR]);

// 해외 티커의 한국어 통용 표기 — Yahoo 티커/영문명이 국내 기사 본문과 그대로
// 일치하지 않는 경우가 많아 보완한다.
const FOREIGN_ALIAS: Record<string, string> = {
  AAPL: "애플",
  NVDA: "엔비디아",
  MSFT: "마이크로소프트",
  GOOGL: "구글",
  GOOG: "구글",
  AMZN: "아마존",
  TSLA: "테슬라",
  META: "메타",
  TSM: "TSMC",
  QCOM: "퀄컴",
};

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

interface RawPool {
  items: NewsItem[];
  sources: string[];
  failedSources: string[];
}

const globalForNews = globalThis as unknown as {
  __nexusNewsRawCache?: { fetchedAt: number; pool: RawPool };
};

/** Fetch + 24h-window + de-dup the raw feed pool (cached; portfolio-agnostic). */
async function getRawPool(): Promise<RawPool> {
  const cached = globalForNews.__nexusNewsRawCache;
  if (cached && Date.now() - cached.fetchedAt < NEWS_TTL_MS) return cached.pool;

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
    .slice(0, RAW_POOL_CAP);

  const pool: RawPool = { items, sources: FEEDS.map((f) => f.source), failedSources };

  // Don't cache a total wipeout (every feed failed) — retry on the next hit.
  if (failedSources.length < FEEDS.length) {
    globalForNews.__nexusNewsRawCache = { fetchedAt: Date.now(), pool };
  }
  return pool;
}

/**
 * Keywords driven by the current portfolio: heavily-weighted sectors and
 * heavily-held stocks, plus the evergreen 반도체/AI anchor. Computed fresh
 * on every call (cheap — a handful of holdings) so editing the portfolio
 * takes effect immediately, without waiting for the feed cache to expire.
 */
async function getRelevanceKeywords(): Promise<string[]> {
  const keywords = new Set(ANCHOR_KEYWORDS);
  try {
    const assets = await getAssetRepository().list();
    let usdKrw = DEFAULT_USD_KRW;
    try {
      usdKrw = await fetchUsdKrwRate();
    } catch {
      // offline rate is fine here — only used to rank weight, not to display
    }
    const holdings = getStockHoldings(assets, usdKrw);
    if (holdings.length === 0) return [...keywords];

    const byWeight = [...holdings].sort((a, b) => b.weight - a.weight);
    const heavy = byWeight.filter((h) => h.weight >= HEAVY_WEIGHT_PCT);
    for (const h of heavy.length > 0 ? heavy : byWeight.slice(0, TOP_N_FALLBACK)) {
      keywords.add(h.asset.name);
      const ticker = h.asset.ticker?.trim().toUpperCase();
      if (ticker) {
        keywords.add(ticker);
        if (FOREIGN_ALIAS[ticker]) keywords.add(FOREIGN_ALIAS[ticker]);
      }
    }

    for (const sector of getSectorAllocation(holdings)) {
      if (sector.ratio < HEAVY_WEIGHT_PCT) continue;
      if (sector.subSector) keywords.add(sector.subSector);
      if (!SECTOR_KEYWORD_BLOCKLIST.has(sector.baseSector)) keywords.add(sector.baseSector);
    }
  } catch {
    // repository unavailable — the evergreen anchor set alone still applies
  }
  return [...keywords];
}

function isLatinToken(keyword: string): boolean {
  return /^[A-Za-z0-9]+$/.test(keyword);
}

/**
 * Whether `text` contains `keyword`. Korean keywords match as a plain
 * substring (Korean syllable blocks don't suffer word-boundary ambiguity).
 * Short Latin keywords (AI, GPU, tickers) require a word-boundary-ish match
 * so they don't fire on an unrelated English word that happens to contain
 * the same letters.
 */
function matchesKeyword(text: string, keyword: string): boolean {
  if (isLatinToken(keyword)) {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(?<![A-Za-z0-9])${escaped}(?![A-Za-z0-9])`, "i").test(text);
  }
  return text.includes(keyword);
}

function isRelevant(item: NewsItem, keywords: string[]): boolean {
  const text = `${item.title} ${item.summary ?? ""}`;
  return keywords.some((keyword) => matchesKeyword(text, keyword));
}

export async function getNews(): Promise<NewsResult> {
  const [pool, keywords] = await Promise.all([getRawPool(), getRelevanceKeywords()]);
  const items = pool.items.filter((item) => isRelevant(item, keywords)).slice(0, MAX_ITEMS);
  return { items, sources: pool.sources, failedSources: pool.failedSources };
}
