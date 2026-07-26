import { NextRequest, NextResponse } from "next/server";
import { fetchPriceHistory } from "@/lib/services/quote-service";
import type { ClosePoint } from "@/lib/models/stock-history";

interface TickerRef {
  ticker: string;
  market?: string;
}

/**
 * Batch ~1y daily-close history for a set of tickers. Best-effort — a failing
 * ticker is simply omitted. Keyed by the (uppercased) ticker.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const refs: TickerRef[] = Array.isArray(body?.tickers) ? body.tickers : [];

  const entries = await Promise.all(
    refs
      .filter((r) => typeof r?.ticker === "string" && r.ticker.trim())
      .map(async (r): Promise<[string, ClosePoint[]] | null> => {
        try {
          const closes = await fetchPriceHistory(r.ticker.trim(), r.market);
          return closes.length > 1 ? [r.ticker.trim().toUpperCase(), closes] : null;
        } catch {
          return null;
        }
      })
  );

  const series: Record<string, ClosePoint[]> = {};
  for (const entry of entries) {
    if (entry) series[entry[0]] = entry[1];
  }
  return NextResponse.json({ series });
}
