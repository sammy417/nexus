import { NextRequest, NextResponse } from "next/server";
import { importBackup } from "@/lib/services/backup-service";
import { toErrorResponse } from "@/lib/api-error";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const result = await importBackup(body);
    return NextResponse.json(result);
  } catch (error) {
    // Validation failures are the user's bad file, not a server fault → 400.
    if (error instanceof Error && !/^\s*$/.test(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return toErrorResponse(error);
  }
}
