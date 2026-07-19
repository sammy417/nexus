import { NextResponse } from "next/server";
import { exportBackup } from "@/lib/services/backup-service";
import { toErrorResponse } from "@/lib/api-error";

export async function GET() {
  try {
    const backup = await exportBackup();
    const filename = `nexus-backup-${backup.exportedAt.slice(0, 10)}.json`;
    return new NextResponse(JSON.stringify(backup, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
