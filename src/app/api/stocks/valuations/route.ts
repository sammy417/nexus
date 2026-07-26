import { NextRequest, NextResponse } from "next/server";
import { fetchStockValuation } from "@/lib/services/quote-service";
import type { StockValuation } from "@/lib/models/stock-valuation";

interface TickerRef {
  ticker: string;
  market?: string;
}

/**
 * Best-effort valuation lookup for a batch of tickers. Each is fetched
 * independently — one failing ticker never fails the whole request; it's
 * simply omitted from the result. Keyed by the (uppercased) ticker.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const refs: TickerRef[] = Array.isArray(body?.tickers) ? body.tickers : [];

  const entries = await Promise.all(
    refs
      .filter((r) => typeof r?.ticker === "string" && r.ticker.trim())
      .map(async (r): Promise<[string, StockValuation] | null> => {
        try {
          const value = await fetchStockValuation(r.ticker.trim(), r.market);
          return [r.ticker.trim().toUpperCase(), value];
        } catch {
          return null;
        }
      })
  );

  const valuations: Record<string, StockValuation> = {};
  for (const entry of entries) {
    if (entry) valuations[entry[0]] = entry[1];
  }
  return NextResponse.json({ valuations });
}
