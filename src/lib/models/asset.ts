/**
 * Core asset domain model.
 *
 * MVP supports "CASH" and "STOCK" only. To add a new asset type later
 * (e.g. "BOND", "PENSION"):
 *   1. Add the type string to `AssetType` below.
 *   2. Add a matching interface extending `BaseAsset`.
 *   3. Add it to the `Asset` union and `AssetInput` union.
 *   4. Add a label in `src/lib/models/asset-types.ts`.
 *   5. Add a case in `getAssetMetrics` (src/lib/services/portfolio-service.ts) —
 *      TypeScript's exhaustiveness check will point you to every place
 *      that still needs a case.
 * No repository or UI code needs to change shape-by-shape; both the
 * SQLite and mock repositories persist the type-specific fields as an
 * opaque JSON payload keyed by `type`.
 */

export type AssetType = "CASH" | "STOCK";

/**
 * All amounts are in KRW for MVP (no multi-currency/FX conversion yet).
 * Multi-currency support is a natural later extension — it would add a
 * `currency` field here plus an FX-aware step in the portfolio service,
 * not a rearchitecture.
 */
interface BaseAsset {
  id: string;
  name: string;
  memo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CashAsset extends BaseAsset {
  type: "CASH";
  /** Current balance held in this cash account/deposit. */
  balance: number;
}

export interface StockAsset extends BaseAsset {
  type: "STOCK";
  /** Exchange/market, e.g. "KRX", "NASDAQ". Free text for MVP. */
  market?: string;
  ticker?: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
}

export type Asset = CashAsset | StockAsset;

export type CashAssetInput = Omit<CashAsset, "id" | "createdAt" | "updatedAt">;
export type StockAssetInput = Omit<StockAsset, "id" | "createdAt" | "updatedAt">;

export type AssetInput = CashAssetInput | StockAssetInput;
