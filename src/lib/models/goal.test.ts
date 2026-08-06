import { describe, expect, it } from "vitest";
import {
  assignAssetToGoal,
  createGoal,
  Goal,
  goalIdForAsset,
  normalizeGoals,
  unassignAsset,
} from "./goal";

function goal(over: Partial<Goal> & { id: string }): Goal {
  return { name: "목표", targetAmountKrw: 1_000_000, targetDate: "2027-01-01", assetIds: [], ...over };
}

describe("createGoal", () => {
  it("trims the name, starts empty, and mints an id", () => {
    const g = createGoal("  주택 자금  ", 100_000_000, "2028-03-01");
    expect(g.name).toBe("주택 자금");
    expect(g.assetIds).toEqual([]);
    expect(g.id).toMatch(/^goal_/);
  });
});

describe("normalizeGoals", () => {
  it("returns an empty list for non-arrays", () => {
    for (const v of [undefined, null, {}, 5, "x"]) expect(normalizeGoals(v)).toEqual([]);
  });

  it("drops goals without a name or a valid date", () => {
    const result = normalizeGoals([
      { id: "a", name: "", targetDate: "2027-01-01" },
      { id: "b", name: "차", targetDate: "not-a-date" },
      { id: "c", name: "집", targetDate: "2027-01-01", targetAmountKrw: 100 },
    ]);
    expect(result.map((g) => g.id)).toEqual(["c"]);
  });

  it("floors an invalid target amount to zero", () => {
    const [g] = normalizeGoals([{ id: "a", name: "집", targetDate: "2027-01-01", targetAmountKrw: -5 }]);
    expect(g.targetAmountKrw).toBe(0);
  });

  it("dedupes asset ids and keeps each asset in only the first goal that claims it", () => {
    const result = normalizeGoals([
      { id: "a", name: "집", targetDate: "2027-01-01", assetIds: ["x", "x", "y"] },
      { id: "b", name: "차", targetDate: "2028-01-01", assetIds: ["y", "z"] },
    ]);
    expect(result[0].assetIds).toEqual(["x", "y"]);
    expect(result[1].assetIds).toEqual(["z"]); // "y" already claimed by goal a
  });

  it("mints an id for a goal missing one", () => {
    const [g] = normalizeGoals([{ name: "집", targetDate: "2027-01-01" }]);
    expect(g.id).toMatch(/^goal_/);
  });
});

describe("assignAssetToGoal", () => {
  const goals = [goal({ id: "a", assetIds: ["x"] }), goal({ id: "b", assetIds: [] })];

  it("adds an asset to the target goal", () => {
    const result = assignAssetToGoal(goals, "b", "y");
    expect(result.find((g) => g.id === "b")?.assetIds).toEqual(["y"]);
  });

  it("moves an asset out of the goal that held it (one goal per asset)", () => {
    const result = assignAssetToGoal(goals, "b", "x");
    expect(result.find((g) => g.id === "a")?.assetIds).toEqual([]);
    expect(result.find((g) => g.id === "b")?.assetIds).toEqual(["x"]);
  });

  it("is a no-op when the asset is already on the target goal", () => {
    const result = assignAssetToGoal(goals, "a", "x");
    expect(result.find((g) => g.id === "a")?.assetIds).toEqual(["x"]);
  });
});

describe("unassignAsset / goalIdForAsset", () => {
  const goals = [goal({ id: "a", assetIds: ["x", "y"] }), goal({ id: "b", assetIds: ["z"] })];

  it("removes an asset from whichever goal holds it", () => {
    const result = unassignAsset(goals, "y");
    expect(result.find((g) => g.id === "a")?.assetIds).toEqual(["x"]);
  });

  it("reports which goal an asset belongs to", () => {
    expect(goalIdForAsset(goals, "z")).toBe("b");
    expect(goalIdForAsset(goals, "nope")).toBeNull();
  });
});
