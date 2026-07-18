import { NextResponse } from "next/server";
import { listSnapshotsWithToday } from "@/lib/repositories/snapshot-sync";
import { toErrorResponse } from "@/lib/api-error";

export async function GET() {
  try {
    const snapshots = await listSnapshotsWithToday();
    return NextResponse.json(snapshots);
  } catch (error) {
    return toErrorResponse(error);
  }
}
