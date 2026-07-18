import { NextRequest, NextResponse } from "next/server";
import { getAssetRepository } from "@/lib/repositories";
import { isValidAssetInput } from "@/lib/models/validate-asset-input";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!isValidAssetInput(body)) {
    return NextResponse.json({ error: "Invalid asset payload" }, { status: 400 });
  }

  const asset = await getAssetRepository().update(id, body);
  if (!asset) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }
  return NextResponse.json(asset);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const removed = await getAssetRepository().remove(id);
  if (!removed) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
