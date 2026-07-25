import { NextRequest, NextResponse } from "next/server";
import { getSettingsRepository } from "@/lib/repositories";
import { normalizeSettings } from "@/lib/models/settings";
import { toErrorResponse } from "@/lib/api-error";

export async function GET() {
  try {
    return NextResponse.json(await getSettingsRepository().get());
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const settings = await getSettingsRepository().save(normalizeSettings(body));
    return NextResponse.json(settings);
  } catch (error) {
    return toErrorResponse(error);
  }
}
