"use client";

import { useCallback, useState } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { useT } from "@/lib/i18n/locale-context";

/**
 * Shared column-sorting primitives for the app's data tables.
 *
 * Click a header to sort; click again to flip direction. Text columns
 * (names, sectors) compare with `localeCompare("ko")` so identical text
 * groups together; numeric columns compare numerically. Nullish/NaN values
 * always sink to the bottom regardless of direction, so "no data" rows
 * never crowd the top.
 */

export type SortDirection = "asc" | "desc";

export interface SortState<K extends string = string> {
  key: K;
  direction: SortDirection;
}

const headerCellClass = "px-4 py-3 text-xs font-medium text-gray-400 dark:text-gray-500";

/**
 * A sortable `<th>`. Numeric columns default to descending on first click;
 * pass `text` for columns that should start ascending (A→Z, 가→힣).
 */
export function SortableHeader<K extends string>({
  label,
  sortKey,
  sort,
  onToggle,
  align = "right",
  className = "",
}: {
  label: string;
  sortKey: K;
  sort: SortState<K> | null;
  onToggle: (key: K) => void;
  align?: "left" | "right";
  className?: string;
}) {
  const active = sort?.key === sortKey;
  const t = useT();
  return (
    <th className={`${headerCellClass} ${align === "right" ? "text-right" : ""} ${className}`}>
      <button
        type="button"
        onClick={() => onToggle(sortKey)}
        aria-label={t("{label} 기준 정렬", { label: t(label) })}
        className={`group/sort inline-flex items-center gap-0.5 transition-colors hover:text-gray-600 dark:hover:text-gray-300 ${
          active ? "text-gray-700 dark:text-gray-200" : ""
        }`}
      >
        {t(label)}
        {active ? (
          sort!.direction === "desc" ? (
            <ArrowDown size={12} />
          ) : (
            <ArrowUp size={12} />
          )
        ) : (
          <ChevronsUpDown size={12} className="opacity-0 group-hover/sort:opacity-60" />
        )}
      </button>
    </th>
  );
}

/**
 * Sort state + toggle. `textKeys` lists the columns that should start
 * ascending on first click (everything else starts descending).
 */
export function useSort<K extends string>(
  textKeys: readonly K[] = [],
  initial: SortState<K> | null = null
) {
  const [sort, setSort] = useState<SortState<K> | null>(initial);
  const toggle = useCallback(
    (key: K) => {
      setSort((prev) => {
        if (!prev || prev.key !== key) {
          return { key, direction: textKeys.includes(key) ? "asc" : "desc" };
        }
        return { key, direction: prev.direction === "desc" ? "asc" : "desc" };
      });
    },
    [textKeys]
  );
  return { sort, toggle, setSort };
}

function isNullish(value: string | number | null | undefined): boolean {
  return value === null || value === undefined || (typeof value === "number" && Number.isNaN(value));
}

/**
 * Return a sorted copy of `rows`. `getValue` maps a row + column key to its
 * comparable value (string → text compare, number → numeric); nullish values
 * always sort last. When no column is active, `fallback` (if given) sets the
 * default order.
 */
export function sortRows<T, K extends string>(
  rows: readonly T[],
  sort: SortState<K> | null,
  getValue: (row: T, key: K) => string | number | null | undefined,
  fallback: SortState<K> | null = null
): T[] {
  const effective = sort ?? fallback;
  if (!effective) return [...rows];
  const { key, direction } = effective;
  return [...rows].sort((a, b) => {
    const va = getValue(a, key);
    const vb = getValue(b, key);
    const aNull = isNullish(va);
    const bNull = isNullish(vb);
    if (aNull && bNull) return 0;
    if (aNull) return 1;
    if (bNull) return -1;
    const compared =
      typeof va === "string" && typeof vb === "string"
        ? va.localeCompare(vb, "ko")
        : (va as number) - (vb as number);
    return direction === "asc" ? compared : -compared;
  });
}
