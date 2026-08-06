import { Asset } from "@/lib/models/asset";
import { Goal } from "@/lib/models/goal";
import { getPortfolioCategory } from "@/lib/models/portfolio-category";
import { getAssetMetrics } from "./portfolio-service";

/**
 * Progress of dated savings goals against the assets earmarked for them, plus
 * the assets left unassigned. Two judgments matter here and neither is a
 * plain "how much":
 *
 *  - **Pace**: what monthly saving would still land the goal on time.
 *  - **Suitability**: money needed soon shouldn't be sitting in equities. A
 *    goal three years out with most of its assets in stocks is flagged, since
 *    a drawdown right before the deadline is the risk that actually bites.
 *
 * KRW base throughout; the display layer converts.
 */

/** A goal that comes due within this many months is "near-term" for the equity check. */
export const NEAR_TERM_MONTHS = 36;
/** Stock share above this, on a near-term goal, is worth warning about. */
export const NEAR_TERM_STOCK_RATIO = 0.4;

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const DAYS_PER_MONTH = 30.4375;

function daysUntil(dateStr: string, now: Date): number {
  const target = new Date(`${dateStr}T00:00:00.000Z`).getTime();
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((target - today) / MS_PER_DAY);
}

function isStock(asset: Asset): boolean {
  const category = getPortfolioCategory(asset);
  return category === "STOCK_KR" || category === "STOCK_FOREIGN";
}

export interface GoalProgress {
  goal: Goal;
  /** Valuation of the still-existing assets earmarked for the goal (KRW). */
  assignedKrw: number;
  targetAmountKrw: number;
  /** assigned ÷ target (0..∞); 1 when the target is 0 and something is assigned. */
  progressRatio: number;
  /** max(0, target − assigned). */
  remainingKrw: number;
  daysRemaining: number;
  monthsRemaining: number;
  /** Monthly saving that still lands the goal on time; null when complete or already due. */
  requiredMonthlyKrw: number | null;
  /** Valuation of the earmarked assets that are stocks (KRW). */
  stockKrw: number;
  /** stock ÷ assigned (0 when nothing is assigned). */
  stockRatio: number;
  complete: boolean;
  /** The target date has passed and the goal isn't fully funded. */
  pastDue: boolean;
  /** Due soon and holding too much equity for comfort. */
  nearTermEquityRisk: boolean;
  /** Earmarked ids that no longer resolve to an asset (deleted since). */
  missingAssetIds: string[];
}

export function getGoalProgress(goal: Goal, assets: Asset[], usdKrw: number, now = new Date()): GoalProgress {
  const byId = new Map(assets.map((a) => [a.id, a]));
  const missingAssetIds: string[] = [];

  let assignedKrw = 0;
  let stockKrw = 0;
  for (const assetId of goal.assetIds) {
    const asset = byId.get(assetId);
    if (!asset) {
      missingAssetIds.push(assetId);
      continue;
    }
    const { valuation } = getAssetMetrics(asset, usdKrw);
    assignedKrw += valuation;
    if (isStock(asset)) stockKrw += valuation;
  }

  const targetAmountKrw = Math.max(0, goal.targetAmountKrw);
  const remainingKrw = Math.max(0, targetAmountKrw - assignedKrw);
  const progressRatio = targetAmountKrw <= 0 ? (assignedKrw > 0 ? 1 : 0) : assignedKrw / targetAmountKrw;
  const complete = assignedKrw >= targetAmountKrw && targetAmountKrw > 0;

  const daysRemaining = daysUntil(goal.targetDate, now);
  const monthsRemaining = daysRemaining / DAYS_PER_MONTH;
  const pastDue = daysRemaining < 0 && !complete;

  // Spreading only makes sense with real time left and money still to save.
  const requiredMonthlyKrw =
    complete || remainingKrw <= 0 || monthsRemaining < 1 ? null : remainingKrw / monthsRemaining;

  const stockRatio = assignedKrw > 0 ? stockKrw / assignedKrw : 0;
  const nearTermEquityRisk =
    !complete &&
    assignedKrw > 0 &&
    daysRemaining <= NEAR_TERM_MONTHS * DAYS_PER_MONTH &&
    stockRatio > NEAR_TERM_STOCK_RATIO;

  return {
    goal,
    assignedKrw,
    targetAmountKrw,
    progressRatio,
    remainingKrw,
    daysRemaining,
    monthsRemaining,
    requiredMonthlyKrw,
    stockKrw,
    stockRatio,
    complete,
    pastDue,
    nearTermEquityRisk,
    missingAssetIds,
  };
}

/** Every goal's progress, soonest deadline first. */
export function getAllGoalProgress(goals: Goal[], assets: Asset[], usdKrw: number, now = new Date()): GoalProgress[] {
  return goals
    .map((goal) => getGoalProgress(goal, assets, usdKrw, now))
    .sort((a, b) => a.daysRemaining - b.daysRemaining);
}

export interface UnassignedSummary {
  assets: Asset[];
  totalKrw: number;
}

/** Assets not earmarked for any goal, with their combined valuation. */
export function getUnassignedAssets(assets: Asset[], goals: Goal[], usdKrw: number): UnassignedSummary {
  const claimed = new Set(goals.flatMap((goal) => goal.assetIds));
  const unassigned = assets.filter((asset) => !claimed.has(asset.id));
  const totalKrw = unassigned.reduce((sum, asset) => sum + getAssetMetrics(asset, usdKrw).valuation, 0);
  return { assets: unassigned, totalKrw };
}
