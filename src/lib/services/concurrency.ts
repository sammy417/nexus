/**
 * Run an async task over a list with a ceiling on how many are in flight.
 *
 * The external-data services fan out over one ticker at a time; doing that
 * sequentially makes the total wait the *sum* of every upstream round-trip,
 * but firing all of them at once invites rate-limiting from the provider.
 * A small pool gets almost all of the speedup without the burst.
 *
 * Results come back in input order regardless of completion order, so
 * callers can keep deterministic output (stable sorts, stable failure
 * lists) without extra bookkeeping.
 */
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  task: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  if (items.length === 0) return results;

  // Never fewer than one worker, never more than there is work to do.
  const workers = Math.max(1, Math.min(Math.floor(limit) || 1, items.length));
  let cursor = 0;

  async function run(): Promise<void> {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await task(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: workers }, run));
  return results;
}
