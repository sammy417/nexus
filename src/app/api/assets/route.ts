import { NextRequest, NextResponse } from "next/server";
import { getAssetRepository } from "@/lib/repositories";
import { captureTodaySnapshot } from "@/lib/repositories/snapshot-sync";
import { isValidAssetInput } from "@/lib/models/validate-asset-input";
import { toErrorResponse } from "@/lib/api-error";

export async function GET() {
  try {
    const assets = await getAssetRepository().list();
    return NextResponse.json(assets);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!isValidAssetInput(body)) {
      return NextResponse.json({ error: "Invalid asset payload" }, { status: 400 });
    }
    const asset = await getAssetRepository().create(body);
    await captureTodaySnapshot();
    return NextResponse.json(asset, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
