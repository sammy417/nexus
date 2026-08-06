/**
 * A dated savings goal (주택·교육·차량 등) that specific assets are earmarked
 * toward. Unlike the retirement projection — a long-horizon engine — these
 * are near-to-mid term buckets whose whole point is "is this money set aside,
 * and is it in something safe enough for when I need it".
 *
 * An asset belongs to **at most one goal**, so a household asset is either
 * earmarked for exactly one goal or unassigned. That keeps progress
 * non-overlapping and "미배정 자산" unambiguous.
 *
 * Stored in settings as a plain list (JSON blob), so no migration and it
 * rides along in backup/restore like every other setting.
 */
export interface Goal {
  id: string;
  name: string;
  /** Amount needed, in KRW (today's money — near-term, so inflation is ignored). */
  targetAmountKrw: number;
  /** YYYY-MM-DD. */
  targetDate: string;
  /** Ids of the assets earmarked for this goal. */
  assetIds: string[];
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function randomId(): string {
  return `goal_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createGoal(name: string, targetAmountKrw: number, targetDate: string): Goal {
  return { id: randomId(), name: name.trim(), targetAmountKrw, targetDate, assetIds: [] };
}

/** Coerce an unknown stored/imported value into a clean goal list. */
export function normalizeGoals(value: unknown): Goal[] {
  if (!Array.isArray(value)) return [];
  const seenAssetIds = new Set<string>();
  const goals: Goal[] = [];

  for (const raw of value) {
    if (!raw || typeof raw !== "object") continue;
    const g = raw as Record<string, unknown>;
    const id = typeof g.id === "string" && g.id ? g.id : randomId();
    const name = typeof g.name === "string" ? g.name.trim() : "";
    const targetDate = typeof g.targetDate === "string" && DATE_RE.test(g.targetDate) ? g.targetDate : "";
    if (!name || !targetDate) continue; // a goal without a name or date can't be shown or scheduled

    const targetAmountKrw =
      typeof g.targetAmountKrw === "number" && Number.isFinite(g.targetAmountKrw) && g.targetAmountKrw > 0
        ? g.targetAmountKrw
        : 0;

    // Each asset id lands in the first goal that claims it — enforces the
    // "one goal per asset" rule even against a hand-edited settings blob.
    const assetIds: string[] = [];
    if (Array.isArray(g.assetIds)) {
      for (const assetId of g.assetIds) {
        if (typeof assetId === "string" && assetId && !seenAssetIds.has(assetId)) {
          seenAssetIds.add(assetId);
          assetIds.push(assetId);
        }
      }
    }

    goals.push({ id, name, targetAmountKrw, targetDate, assetIds });
  }

  return goals;
}

/** Assign an asset to one goal, removing it from any other (one goal per asset). */
export function assignAssetToGoal(goals: Goal[], goalId: string, assetId: string): Goal[] {
  return goals.map((goal) => {
    if (goal.id === goalId) {
      return goal.assetIds.includes(assetId)
        ? goal
        : { ...goal, assetIds: [...goal.assetIds, assetId] };
    }
    return goal.assetIds.includes(assetId)
      ? { ...goal, assetIds: goal.assetIds.filter((id) => id !== assetId) }
      : goal;
  });
}

/** Remove an asset from whichever goal holds it. */
export function unassignAsset(goals: Goal[], assetId: string): Goal[] {
  return goals.map((goal) =>
    goal.assetIds.includes(assetId)
      ? { ...goal, assetIds: goal.assetIds.filter((id) => id !== assetId) }
      : goal
  );
}

/** The goal an asset is currently earmarked for, if any. */
export function goalIdForAsset(goals: Goal[], assetId: string): string | null {
  return goals.find((goal) => goal.assetIds.includes(assetId))?.id ?? null;
}
