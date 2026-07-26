import { NextRequest, NextResponse } from "next/server";
import { fetchQuoteKrw, fetchStockSector } from "@/lib/services/quote-service";
import { normalizeSector } from "@/lib/models/stock-sector";

export async function GET(request: NextRequest) {
  const ticker = request.nextUrl.searchParams.get("ticker")?.trim();
  const market = request.nextUrl.searchParams.get("market")?.trim() || undefined;
  if (!ticker) {
    return NextResponse.json({ error: "ticker query parameter is required" }, { status: 400 });
  }

  try {
    const quote = await fetchQuoteKrw(ticker, market);
    // Sector is a best-effort extra — never fail the quote over it.
    const sector = await fetchStockSector(ticker, market)
      .then((raw) => normalizeSector(raw))
      .catch(() => undefined);
    return NextResponse.json({ ...quote, sector });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Quote lookup failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
