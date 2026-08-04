import { describe, expect, it } from "vitest";
import { mapWithConcurrency } from "./concurrency";

/** Resolves after `ms`, tracking how many calls overlap. */
function tracker() {
  const state = { inFlight: 0, peak: 0, started: [] as number[] };
  return {
    state,
    task: async (value: number) => {
      state.inFlight++;
      state.peak = Math.max(state.peak, state.inFlight);
      state.started.push(value);
      await new Promise((resolve) => setTimeout(resolve, 1));
      state.inFlight--;
      return value * 2;
    },
  };
}

describe("mapWithConcurrency", () => {
  it("returns results in input order, not completion order", async () => {
    // Later items finish first, so completion order is the reverse.
    const results = await mapWithConcurrency([30, 20, 10], 3, async (ms) => {
      await new Promise((resolve) => setTimeout(resolve, ms));
      return ms;
    });
    expect(results).toEqual([30, 20, 10]);
  });

  it("never runs more than the limit at once", async () => {
    const { state, task } = tracker();
    await mapWithConcurrency([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 3, task);
    expect(state.peak).toBe(3);
  });

  it("uses every worker it is allowed", async () => {
    const { state, task } = tracker();
    await mapWithConcurrency([1, 2, 3, 4, 5, 6], 6, task);
    expect(state.peak).toBe(6);
  });

  it("processes every item exactly once", async () => {
    const { state, task } = tracker();
    const items = Array.from({ length: 25 }, (_, i) => i);
    const results = await mapWithConcurrency(items, 4, task);
    expect(results).toEqual(items.map((i) => i * 2));
    expect([...state.started].sort((a, b) => a - b)).toEqual(items);
  });

  it("passes the index alongside the item", async () => {
    const seen = await mapWithConcurrency(["a", "b", "c"], 2, async (item, index) => `${index}${item}`);
    expect(seen).toEqual(["0a", "1b", "2c"]);
  });

  it("does not spin up more workers than there is work", async () => {
    const { state, task } = tracker();
    await mapWithConcurrency([1, 2], 100, task);
    expect(state.peak).toBe(2);
  });

  it("falls back to one worker for a nonsensical limit", async () => {
    for (const limit of [0, -5, Number.NaN]) {
      const { state, task } = tracker();
      await mapWithConcurrency([1, 2, 3], limit, task);
      expect(state.peak).toBe(1);
    }
  });

  it("returns an empty array without calling the task", async () => {
    let calls = 0;
    const results = await mapWithConcurrency([], 4, async () => {
      calls++;
      return 1;
    });
    expect(results).toEqual([]);
    expect(calls).toBe(0);
  });

  it("propagates a rejection to the caller", async () => {
    await expect(
      mapWithConcurrency([1, 2, 3], 2, async (value) => {
        if (value === 2) throw new Error("boom");
        return value;
      })
    ).rejects.toThrow("boom");
  });
});
