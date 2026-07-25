import { OwnerFilter } from "@/lib/models/asset-owner";
import { PortfolioSnapshot } from "@/lib/models/snapshot";

/** A history point reduced to what the trend/growth/analytics charts read. */
export interface HistoryPoint {
  date: string;
  totalPrincipal: number;
  totalValuation: number;
}

export interface OwnerShare {
  /** owner principal / household principal */
  principal: number;
  /** owner valuation / household valuation */
  valuation: number;
}

/**
 * Reduce the household snapshot series to the selected owner's series.
 * Uses the stored `byOwner` split when present; for older snapshots that
 * predate it, falls back to scaling the household totals by the owner's
 * *current* share (a reasonable approximation when the split is stable).
 */
export function selectOwnerHistory(
  snapshots: PortfolioSnapshot[],
  filter: OwnerFilter,
  fallbackShare?: OwnerShare
): HistoryPoint[] {
  if (filter === "ALL") {
    return snapshots.map((s) => ({
      date: s.date,
      totalPrincipal: s.totalPrincipal,
      totalValuation: s.totalValuation,
    }));
  }

  const points: HistoryPoint[] = [];
  for (const s of snapshots) {
    const entry = s.byOwner?.[filter];
    if (entry) {
      points.push({ date: s.date, totalPrincipal: entry.principal, totalValuation: entry.valuation });
    } else if (fallbackShare) {
      points.push({
        date: s.date,
        totalPrincipal: Math.round(s.totalPrincipal * fallbackShare.principal),
        totalValuation: Math.round(s.totalValuation * fallbackShare.valuation),
      });
    }
  }
  return points;
}

/** True when any point in the selected range came from the fallback approximation. */
export function usesFallback(
  snapshots: PortfolioSnapshot[],
  filter: OwnerFilter
): boolean {
  if (filter === "ALL") return false;
  return snapshots.some((s) => !s.byOwner?.[filter]);
}
