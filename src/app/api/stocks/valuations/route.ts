import { NextRequest, NextResponse } from "next/server";
import { fetchStockValuation } from "@/lib/services/quote-service";
import type { StockValuation } from "@/lib/models/stock-valuation";

interface TickerRef {
  ticker: string;
  market?: string;
}

/**
 * Best-effort valuation lookup for a batch of tickers. Each is fetched
 * independently — one failing ticker never fails the whole request.
 * Successful lookups are keyed by the (uppercased) ticker; the ones that
 * failed are listed in `failed` so the UI can tell "no data came back"
 * apart from "the provider is unreachable" instead of silently rendering
 * an empty comparison.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const refs: TickerRef[] = Array.isArray(body?.tickers) ? body.tickers : [];

  const entries = await Promise.all(
    refs
      .filter((r) => typeof r?.ticker === "string" && r.ticker.trim())
      .map(async (r): Promise<[string, StockValuation | null]> => {
        const key = r.ticker.trim().toUpperCase();
        try {
          return [key, await fetchStockValuation(r.ticker.trim(), r.market)];
        } catch {
          return [key, null];
        }
      })
  );

  const valuations: Record<string, StockValuation> = {};
  const failed: string[] = [];
  for (const [key, value] of entries) {
    if (value) valuations[key] = value;
    else failed.push(key);
  }
  return NextResponse.json({ valuations, failed });
}
