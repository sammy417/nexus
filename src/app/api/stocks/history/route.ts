import { NextRequest, NextResponse } from "next/server";
import { fetchPriceHistory } from "@/lib/services/quote-service";
import type { ClosePoint } from "@/lib/models/stock-history";

interface TickerRef {
  ticker: string;
  market?: string;
}

/**
 * Batch ~1y daily-close history for a set of tickers. Best-effort — a failing
 * ticker never fails the whole request. Keyed by the (uppercased) ticker;
 * tickers whose lookup threw are listed in `failed` so the UI can say
 * "couldn't load" rather than implying the holding has no price history.
 *
 * A ticker that returns too few points to analyse is *not* a failure — it's
 * simply absent from `series` (and from `failed`).
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const refs: TickerRef[] = Array.isArray(body?.tickers) ? body.tickers : [];

  const entries = await Promise.all(
    refs
      .filter((r) => typeof r?.ticker === "string" && r.ticker.trim())
      .map(async (r): Promise<[string, ClosePoint[] | null]> => {
        const key = r.ticker.trim().toUpperCase();
        try {
          const closes = await fetchPriceHistory(r.ticker.trim(), r.market);
          return [key, closes.length > 1 ? closes : []];
        } catch {
          return [key, null];
        }
      })
  );

  const series: Record<string, ClosePoint[]> = {};
  const failed: string[] = [];
  for (const [key, closes] of entries) {
    if (closes === null) failed.push(key);
    else if (closes.length > 0) series[key] = closes;
  }
  return NextResponse.json({ series, failed });
}
