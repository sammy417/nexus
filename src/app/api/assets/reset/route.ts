import { NextResponse } from "next/server";
import { getAssetRepository, getDividendRepository } from "@/lib/repositories";
import { resetSnapshotHistory } from "@/lib/repositories/snapshot-sync";
import { toErrorResponse } from "@/lib/api-error";

export async function POST() {
  try {
    const assets = await getAssetRepository().reset();
    await resetSnapshotHistory();
    await getDividendRepository().reset();
    return NextResponse.json(assets);
  } catch (error) {
    return toErrorResponse(error);
  }
}
