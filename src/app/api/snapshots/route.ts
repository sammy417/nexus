import { NextResponse } from "next/server";
import { listSnapshotsWithToday } from "@/lib/repositories/snapshot-sync";

export async function GET() {
  const snapshots = await listSnapshotsWithToday();
  return NextResponse.json(snapshots);
}
