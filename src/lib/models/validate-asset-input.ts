import { AssetInput } from "./asset";

/** Minimal runtime shape check for API request bodies (no schema library needed at MVP scale). */
export function isValidAssetInput(value: unknown): value is AssetInput {
  if (!value || typeof value !== "object") return false;
  const input = value as Record<string, unknown>;

  if (typeof input.name !== "string" || input.name.trim().length === 0) return false;

  if (input.type === "CASH") {
    return typeof input.balance === "number" && Number.isFinite(input.balance);
  }

  if (input.type === "STOCK") {
    return (
      typeof input.quantity === "number" &&
      typeof input.avgPrice === "number" &&
      typeof input.currentPrice === "number" &&
      Number.isFinite(input.quantity) &&
      Number.isFinite(input.avgPrice) &&
      Number.isFinite(input.currentPrice)
    );
  }

  return false;
}
