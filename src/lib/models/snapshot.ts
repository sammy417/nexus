import { AssetType } from "./asset";

/**
 * One point of portfolio history: the whole portfolio's state on a given
 * day. At most one snapshot per date — recording again on the same day
 * overwrites it, so the series stays daily-grained.
 */
export interface PortfolioSnapshot {
  /** YYYY-MM-DD */
  date: string;
  totalPrincipal: number;
  totalValuation: number;
  /** Valuation per asset type on that day (types with 0 omitted). */
  byType: Partial<Record<AssetType, number>>;
}
