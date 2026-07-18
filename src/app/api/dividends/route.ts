import { NextRequest, NextResponse } from "next/server";
import { getDividendRepository } from "@/lib/repositories";
import { isValidDividendInput } from "@/lib/models/dividend";
import { toErrorResponse } from "@/lib/api-error";

export async function GET() {
  try {
    const dividends = await getDividendRepository().list();
    return NextResponse.json(dividends);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!isValidDividendInput(body)) {
      return NextResponse.json({ error: "Invalid dividend payload" }, { status: 400 });
    }
    const record = await getDividendRepository().create(body);
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
