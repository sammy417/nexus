import { NextResponse } from "next/server";
import { fetchUsdKrwRate } from "@/lib/services/quote-service";

export async function GET() {
  try {
    const usdKrw = await fetchUsdKrwRate();
    return NextResponse.json({ usdKrw });
  } catch (error) {
    const message = error instanceof Error ? error.message : "FX lookup failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
