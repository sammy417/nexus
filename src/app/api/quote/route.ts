import { NextRequest, NextResponse } from "next/server";
import { fetchQuoteKrw } from "@/lib/services/quote-service";

export async function GET(request: NextRequest) {
  const ticker = request.nextUrl.searchParams.get("ticker")?.trim();
  const market = request.nextUrl.searchParams.get("market")?.trim() || undefined;
  if (!ticker) {
    return NextResponse.json({ error: "ticker query parameter is required" }, { status: 400 });
  }

  try {
    const quote = await fetchQuoteKrw(ticker, market);
    return NextResponse.json(quote);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Quote lookup failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
