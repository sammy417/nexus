"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import type { DividendSuggestion } from "@/lib/services/dividend-forecast-service";
import { DividendInput, DividendRecord } from "@/lib/models/dividend";
import { useDisplayCurrency } from "@/lib/currency-context";
import { useSettings } from "@/lib/settings-context";

/**
 * Past ex-dividends from external data that aren't in the user's records
 * yet, offered as one-click "받았어요" additions (pre-tax, current
 * quantity — the amount is editable after adding via the normal record).
 */
export default function DividendSuggestions({
  suggestions,
  existing,
  onAdd,
}: {
  suggestions: DividendSuggestion[];
  existing: DividendRecord[];
  onAdd: (input: DividendInput) => Promise<void>;
}) {
  const { money } = useDisplayCurrency();
  const { ownerName } = useSettings();
  const [addingKey, setAddingKey] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  // A payout counts as "already recorded" if a record shares its name and
  // month — enough to avoid obvious duplicates without exact matching.
  const recordedKeys = useMemo(() => {
    return new Set(existing.map((r) => `${r.name}|${r.date.slice(0, 7)}`));
  }, [existing]);

  const pending = suggestions.filter(
    (s) =>
      !recordedKeys.has(`${s.name}|${s.date.slice(0, 7)}`) &&
      !dismissed.has(`${s.assetId}|${s.date}`)
  );

  if (pending.length === 0) return null;

  async function handleAdd(suggestion: DividendSuggestion) {
    const key = `${suggestion.assetId}|${suggestion.date}`;
    setAddingKey(key);
    try {
      await onAdd({
        name: suggestion.name,
        amount: suggestion.amount,
        currency: suggestion.currency === "USD" ? "USD" : "KRW",
        owner: suggestion.owner,
        date: suggestion.date,
        memo: "배당 이력에서 추가",
      });
      setDismissed((prev) => new Set(prev).add(key));
    } finally {
      setAddingKey(null);
    }
  }

  return (
    <section className="rounded-2xl border border-dashed border-border bg-white p-6 shadow-sm dark:border-border-dark dark:bg-card-dark">
      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">받은 배당 기록 제안</p>
      <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
        외부 배당 이력에서 아직 기록하지 않은 지급 건입니다 (현재 보유 수량·세전 기준 추정) — 실제
        수령한 건만 추가하세요.
      </p>

      <ul className="mt-4 flex flex-col divide-y divide-gray-50 dark:divide-white/5">
        {pending.slice(0, 8).map((suggestion) => {
          const key = `${suggestion.assetId}|${suggestion.date}`;
          return (
            <li key={key} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                  {suggestion.name}
                  <span className="ml-1.5 rounded bg-gray-100 px-1 py-0.5 text-[10px] font-semibold text-gray-500 dark:bg-white/10 dark:text-gray-400">
                    {ownerName(suggestion.owner)}
                  </span>
                </p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500">{suggestion.date}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <p className="text-sm font-semibold text-gray-900 [font-variant-numeric:tabular-nums] dark:text-gray-100">
                  {money(suggestion.amountKrw)}
                </p>
                <button
                  type="button"
                  onClick={() => handleAdd(suggestion)}
                  disabled={addingKey === key}
                  className="flex items-center gap-1 rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-gray-800 disabled:opacity-60 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
                >
                  <Plus size={13} strokeWidth={2.5} />
                  기록
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
