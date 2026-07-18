import { NextResponse } from "next/server";
import { getAssetRepository } from "@/lib/repositories";

export async function POST() {
  const assets = await getAssetRepository().reset();
  return NextResponse.json(assets);
}
