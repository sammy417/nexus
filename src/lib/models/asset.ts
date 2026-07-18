/**
 * Core asset domain model. Currently: CASH, STOCK, BOND.
 *
 * To add a new asset type (e.g. "PENSION"):
 *   1. Add the type string to `AssetType` below.
 *   2. Add a matching interface extending `BaseAsset`.
 *   3. Add it to the `Asset` union and `AssetInput` union.
 *   4. Add a label in `src/lib/models/asset-types.ts`.
 *   5. Add a case in `getAssetMetrics` (src/lib/services/portfolio-service.ts).
 *   Steps 4–5 (and the allocation color map) are enforced by TypeScript's
 *   exhaustiveness checks — `tsc` will point at every remaining spot.
 *
 *   Two places the compiler can NOT catch (they fall through safely but
 *   silently): the runtime body check in `validate-asset-input.ts` (a new
 *   type is rejected with 400 until a branch is added) and the add/edit
 *   form in `AssetFormModal.tsx` (a new type isn't offered until fields
 *   are added). Update both, plus `seed-data.ts` if demo data should
 *   include the new type.
 *
 * No repository or API code needs to change: both the SQLite and mock
 * repositories persist type-specific fields as an opaque JSON payload
 * keyed by `type`, so no schema migration is needed either.
 */

export type AssetType = "CASH" | "STOCK" | "BOND";

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

export interface BondAsset extends BaseAsset {
  type: "BOND";
  /** Total amount paid to acquire the bond(s). */
  purchasePrice: number;
  /** Current market value of the position. */
  currentValue: number;
  /** Coupon rate in percent, e.g. 3.2 (optional). */
  couponRate?: number;
  /** Maturity date, YYYY-MM-DD (optional). */
  maturityDate?: string;
}

export type Asset = CashAsset | StockAsset | BondAsset;

export type CashAssetInput = Omit<CashAsset, "id" | "createdAt" | "updatedAt">;
export type StockAssetInput = Omit<StockAsset, "id" | "createdAt" | "updatedAt">;
export type BondAssetInput = Omit<BondAsset, "id" | "createdAt" | "updatedAt">;

export type AssetInput = CashAssetInput | StockAssetInput | BondAssetInput;
