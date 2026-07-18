import { NextResponse } from "next/server";
import { getAssetRepository } from "@/lib/repositories";
import { resetSnapshotHistory } from "@/lib/repositories/snapshot-sync";

export async function POST() {
  const assets = await getAssetRepository().reset();
  await resetSnapshotHistory();
  return NextResponse.json(assets);
}
