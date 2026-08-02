import { Asset, AssetOwner } from "@/lib/models/asset";
import { getAssetOwner } from "@/lib/models/asset-owner";
import { DividendRecord } from "@/lib/models/dividend";
import { PORTFOLIO_CATEGORY_LABEL } from "@/lib/models/portfolio-category";
import { TargetAllocationSettings } from "@/lib/models/target-allocation";
import {
  FINANCIAL_INCOME_THRESHOLD_KRW,
  FOREIGN_CGT_EXEMPTION_KRW,
  PENSION_COMBINED_CREDIT_LIMIT_KRW,
} from "@/lib/models/tax";
import { getRebalancePlan } from "./rebalance-service";
import { getFinancialIncomeSummary, getForeignStockLots } from "./tax-service";
// type-only: the service module itself is server-only
import type { HoldingDividendForecast } from "./dividend-forecast-service";

/**
 * "오늘 챙길 것" — the app's analyses live across seven menus, so this
 * gathers the ones that are actually actionable right now into one ranked
 * list for the dashboard. Every item is derived from calculations that
 * already exist elsewhere; nothing new is computed from scratch.
 *
 * Items are surfaced only when they cross a threshold worth acting on, so
 * a healthy portfolio shows an empty (reassuring) list rather than noise.
 */

export type ActionSeverity = "URGENT" | "ATTENTION" | "INFO";
export type ActionCategory = "REBALANCE" | "TAX" | "DIVIDEND" | "PENSION";

export interface ActionItem {
  id: string;
  severity: ActionSeverity;
  category: ActionCategory;
  /** Korean source string (an i18n key), rendered with `params`. */
  title: string;
  params?: Record<string, string | number>;
  /** Where to go to act on it. */
  href: string;
  /** Which household member it concerns, when applicable. */
  owner?: AssetOwner;
}

const SEVERITY_RANK: Record<ActionSeverity, number> = { URGENT: 0, ATTENTION: 1, INFO: 2 };

/**
 * Tie-breaker within a severity. Tax and pension items are deadline-bound
 * (a calendar year closes and the allowance is gone), so they outrank
 * rebalancing, which can be acted on any time.
 */
const CATEGORY_RANK: Record<ActionCategory, number> = {
  TAX: 0,
  PENSION: 1,
  DIVIDEND: 2,
  REBALANCE: 3,
};

/**
 * Drift shows up on every sleeve at once, so cap it — otherwise six
 * rebalancing rows bury the deadline-bound items behind the "더보기" fold.
 */
const MAX_REBALANCE_ITEMS = 3;

/** Financial income within this fraction of the threshold is worth flagging. */
const INCOME_WARN_RATIO = 0.85;
/** Days ahead to surface an upcoming dividend. */
const DIVIDEND_HORIZON_DAYS = 14;
/** Year-end tax housekeeping starts here (0-indexed month: 10 = November). */
const YEAR_END_MONTH = 10;

function daysUntil(dateStr: string): number {
  return Math.ceil((Date.parse(dateStr) - Date.now()) / 86400000);
}

export interface ActionCenterInput {
  /** Owner-filtered assets — the rebalance check follows the dashboard's scope. */
  scopedAssets: Asset[];
  /** Every household asset, for the per-owner tax checks. */
  allAssets: Asset[];
  dividends: DividendRecord[];
  forecastHoldings: HoldingDividendForecast[];
  usdKrw: number;
  targetAllocation: TargetAllocationSettings;
}

export function getActionItems({
  scopedAssets,
  allAssets,
  dividends,
  forecastHoldings,
  usdKrw,
  targetAllocation,
}: ActionCenterInput): ActionItem[] {
  const items: ActionItem[] = [];
  const now = new Date();
  const isYearEnd = now.getUTCMonth() >= YEAR_END_MONTH;

  // --- 1) Allocation drift -------------------------------------------------
  if (targetAllocation.enabled) {
    const plan = getRebalancePlan(scopedAssets, usdKrw, targetAllocation);
    const worstFirst = plan.rows
      .filter((r) => r.outOfBand)
      .sort((a, b) => Math.abs(b.driftPct) - Math.abs(a.driftPct))
      .slice(0, MAX_REBALANCE_ITEMS);
    for (const row of worstFirst) {
      const overweight = row.driftPct > 0;
      items.push({
        id: `rebalance:${row.category}`,
        // A sleeve more than double its band away is the urgent kind.
        severity: Math.abs(row.driftPct) >= row.tolerancePct * 2 ? "ATTENTION" : "INFO",
        category: "REBALANCE",
        title: overweight
          ? "{category} 비중이 목표보다 {drift}%p 높아요 — {amount} 매도 검토"
          : "{category} 비중이 목표보다 {drift}%p 낮아요 — {amount} 매수 검토",
        params: {
          category: PORTFOLIO_CATEGORY_LABEL[row.category],
          drift: Math.abs(row.driftPct).toFixed(1),
          amount: Math.abs(row.deltaValuation),
        },
        // Same page as the action center itself — a plain "/" Link is a
        // no-op when already there, so point at the rebalance card's own
        // anchor instead (id="rebalance" on RebalanceCard's <section>).
        href: "/#rebalance",
      });
    }
  }

  // --- 2) Per-owner tax checks --------------------------------------------
  const owners = [...new Set(allAssets.map(getAssetOwner))].filter((o) => o !== "JOINT");
  for (const owner of owners) {
    const ownerAssets = allAssets.filter((a) => getAssetOwner(a) === owner);
    const ownerDividends = dividends.filter((r) => (r.owner ?? "JOINT") === owner);
    const ownerForecast = forecastHoldings.filter((h) => h.owner === owner);

    // Financial income vs the 종합과세 threshold (recorded + projected).
    const income = getFinancialIncomeSummary(
      ownerDividends,
      usdKrw,
      0,
      ownerForecast.reduce((sum, h) => sum + (h.nextAmountKrw ?? 0), 0)
    );
    if (income.currentOverThreshold) {
      items.push({
        id: `tax:income-over:${owner}`,
        severity: "URGENT",
        category: "TAX",
        title: "{owner} 금융소득이 기준금액을 {excess} 초과했어요 — 종합과세 대상",
        params: { owner, excess: income.currentExcessKrw },
        href: "/tax",
        owner,
      });
    } else if (income.currentIncomeKrw >= FINANCIAL_INCOME_THRESHOLD_KRW * INCOME_WARN_RATIO) {
      items.push({
        id: `tax:income-near:${owner}`,
        severity: "ATTENTION",
        category: "TAX",
        title: "{owner} 금융소득이 기준금액까지 {remaining} 남았어요",
        params: { owner, remaining: FINANCIAL_INCOME_THRESHOLD_KRW - income.currentIncomeKrw },
        href: "/tax",
        owner,
      });
    } else if (income.projectedOverThreshold) {
      items.push({
        id: `tax:income-projected:${owner}`,
        severity: "ATTENTION",
        category: "TAX",
        title: "{owner} 금융소득이 이대로면 연말에 기준금액을 넘길 것으로 보여요",
        params: { owner },
        href: "/tax",
        owner,
      });
    }

    // Year-end only: unused capital-gains exemption / loss-harvest candidates.
    if (isYearEnd) {
      const lots = getForeignStockLots(ownerAssets, usdKrw);
      const gainers = lots.filter((l) => l.profitKrw > 0);
      const losers = lots.filter((l) => l.profitKrw < 0);
      if (gainers.length > 0) {
        items.push({
          id: `tax:cgt-exemption:${owner}`,
          severity: "ATTENTION",
          category: "TAX",
          title: "{owner} 해외주식 양도세 기본공제 {exemption}가 아직 남아 있어요 — 연내 이익 실현 검토",
          params: { owner, exemption: FOREIGN_CGT_EXEMPTION_KRW },
          href: "/tax",
          owner,
        });
      }
      if (losers.length > 0) {
        items.push({
          id: `tax:harvest:${owner}`,
          severity: "INFO",
          category: "TAX",
          title: "{owner} 평가손실 종목 {count}개 — 연내 손실 확정으로 양도세를 줄일 수 있어요",
          params: { owner, count: losers.length },
          href: "/tax",
          owner,
        });
      }
    }

    // Year-end only: pension contribution room (limit is per person, per year).
    if (isYearEnd && ownerAssets.some((a) => a.type === "PENSION")) {
      items.push({
        id: `pension:room:${owner}`,
        severity: "ATTENTION",
        category: "PENSION",
        title: "{owner} 연금 세액공제 한도 {limit}까지 연내 납입하면 환급받을 수 있어요",
        params: { owner, limit: PENSION_COMBINED_CREDIT_LIMIT_KRW },
        href: "/tax",
        owner,
      });
    }
  }

  // --- 3) Dividends landing soon ------------------------------------------
  for (const holding of forecastHoldings) {
    if (!holding.nextExDateEstimate || holding.nextAmountKrw === null) continue;
    const days = daysUntil(holding.nextExDateEstimate);
    if (days < 0 || days > DIVIDEND_HORIZON_DAYS) continue;
    items.push({
      id: `dividend:${holding.assetId}`,
      severity: "INFO",
      category: "DIVIDEND",
      title: "{name} 배당 {amount} 예상 (D-{days})",
      params: { name: holding.name, amount: holding.nextAmountKrw, days },
      href: "/dividends",
    });
  }

  return items.sort(
    (a, b) =>
      SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] ||
      CATEGORY_RANK[a.category] - CATEGORY_RANK[b.category]
  );
}
