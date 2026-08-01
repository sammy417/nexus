import { NextResponse } from "next/server";
import { getNews } from "@/lib/services/news-service";
import { toErrorResponse } from "@/lib/api-error";

export async function GET() {
  try {
    return NextResponse.json(await getNews());
  } catch (error) {
    return toErrorResponse(error);
  }
}
