import { NextResponse } from "next/server";
import { refreshAllPrices } from "@/lib/services/refresh-prices-service";
import { toErrorResponse } from "@/lib/api-error";

export async function POST() {
  try {
    const result = await refreshAllPrices();
    return NextResponse.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}
