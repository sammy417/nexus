import { NextRequest, NextResponse } from "next/server";
import { getDividendRepository } from "@/lib/repositories";
import { toErrorResponse } from "@/lib/api-error";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const removed = await getDividendRepository().remove(id);
    if (!removed) {
      return NextResponse.json({ error: "Dividend not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
