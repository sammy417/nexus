import { NextResponse } from "next/server";
import { buildDividendForecast } from "@/lib/services/dividend-forecast-service";
import { toErrorResponse } from "@/lib/api-error";

export async function GET() {
  try {
    const forecast = await buildDividendForecast();
    return NextResponse.json(forecast);
  } catch (error) {
    return toErrorResponse(error);
  }
}
