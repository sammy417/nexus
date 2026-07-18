import { AssetInput } from "./asset";

/** Minimal runtime shape check for API request bodies (no schema library needed at MVP scale). */
export function isValidAssetInput(value: unknown): value is AssetInput {
  if (!value || typeof value !== "object") return false;
  const input = value as Record<string, unknown>;

  if (typeof input.name !== "string" || input.name.trim().length === 0) return false;
  if (
    input.currency !== undefined &&
    input.currency !== "KRW" &&
    input.currency !== "USD"
  ) {
    return false;
  }

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

  if (input.type === "BOND") {
    if (input.couponRate !== undefined && typeof input.couponRate !== "number") return false;
    if (input.maturityDate !== undefined && typeof input.maturityDate !== "string") return false;
    return (
      typeof input.purchasePrice === "number" &&
      typeof input.currentValue === "number" &&
      Number.isFinite(input.purchasePrice) &&
      Number.isFinite(input.currentValue)
    );
  }

  if (input.type === "PENSION") {
    if (input.accountType !== undefined && typeof input.accountType !== "string") return false;
    return (
      typeof input.principalPaid === "number" &&
      typeof input.currentValue === "number" &&
      Number.isFinite(input.principalPaid) &&
      Number.isFinite(input.currentValue)
    );
  }

  if (input.type === "CUSTOM") {
    if (input.category !== undefined && typeof input.category !== "string") return false;
    return (
      typeof input.purchasePrice === "number" &&
      typeof input.currentValue === "number" &&
      Number.isFinite(input.purchasePrice) &&
      Number.isFinite(input.currentValue)
    );
  }

  return false;
}
