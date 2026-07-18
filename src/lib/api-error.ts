import "server-only";
import { NextResponse } from "next/server";

/**
 * Uniform JSON error for route handlers. Without this an uncaught server
 * error becomes an HTML 500 page, so the client can only show a generic
 * failure message instead of the actual cause.
 */
export function toErrorResponse(error: unknown): NextResponse {
  const message = error instanceof Error ? error.message : "Unexpected server error";
  console.error("[nexus:api]", error);
  return NextResponse.json({ error: message }, { status: 500 });
}
