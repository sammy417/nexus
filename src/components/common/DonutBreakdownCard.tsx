"use client";

import { useState } from "react";
import { formatMoney } from "@/lib/format";
import { useDisplayCurrency } from "@/lib/currency-context";

export interface DonutEntry {
  id: string;
  label: string;
  color: string;
  /** KRW-base valuation. */
  valuation: number;
  /** Share in percent (entries should sum to ~100). */
  ratio: number;
}

const SIZE = 180;
const CENTER = SIZE / 2;
const RADIUS = 66;
const STROKE = 22;
const HOVER_STROKE = 26;
/** ~2px surface gap between segments at this radius. */
const GAP_ANGLE = 2 / RADIUS;

function arcPath(startAngle: number, endAngle: number): string {
  const start = startAngle + GAP_ANGLE / 2;
  const end = endAngle - GAP_ANGLE / 2;
  const largeArc = end - start > Math.PI ? 1 : 0;
  const x1 = CENTER + RADIUS * Math.cos(start);
  const y1 = CENTER + RADIUS * Math.sin(start);
  const x2 = CENTER + RADIUS * Math.cos(end);
  const y2 = CENTER + RADIUS * Math.sin(end);
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

/** Donut + always-visible legend list (the labels double as the contrast relief). */
export default function DonutBreakdownCard({
  title,
  subtitle,
  ariaLabel,
  entries,
  centerTitle = "평가 금액 합계",
}: {
  title: string;
  subtitle?: string;
  ariaLabel: string;
  entries: DonutEntry[];
  centerTitle?: string;
}) {
  const { displayCurrency, usdKrw } = useDisplayCurrency();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (entries.length === 0) return null;

  const total = entries.reduce((sum, entry) => sum + entry.valuation, 0);
  const hovered = entries.find((entry) => entry.id === hoveredId) ?? null;

  // Segment sweep angles from ratio prefix sums, starting at 12 o'clock.
  const segments = entries.map((entry, index) => {
    const before = entries.slice(0, index).reduce((sum, e) => sum + e.ratio, 0);
    const start = -Math.PI / 2 + (before / 100) * Math.PI * 2;
    const end = start + (entry.ratio / 100) * Math.PI * 2;
    return { entry, start, end };
  });

  return (
    <section className="flex h-full flex-col rounded-2xl bg-white p-6 shadow-sm dark:bg-card-dark">
      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</p>
      {subtitle && (
        <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">{subtitle}</p>
      )}

      <div className="relative mx-auto mt-2">
        <svg width={SIZE} height={SIZE} role="img" aria-label={ariaLabel}>
          {segments.map(({ entry, start, end }) =>
            entries.length === 1 ? (
              <circle
                key={entry.id}
                cx={CENTER}
                cy={CENTER}
                r={RADIUS}
                fill="none"
                stroke={entry.color}
                strokeWidth={hoveredId === entry.id ? HOVER_STROKE : STROKE}
              />
            ) : (
              <path
                key={entry.id}
                d={arcPath(start, end)}
                fill="none"
                stroke={entry.color}
                strokeWidth={hoveredId === entry.id ? HOVER_STROKE : STROKE}
                tabIndex={0}
                aria-label={`${entry.label} ${entry.ratio.toFixed(1)}%`}
                className="cursor-pointer outline-none transition-[stroke-width] duration-150"
                onMouseEnter={() => setHoveredId(entry.id)}
                onMouseLeave={() => setHoveredId(null)}
                onFocus={() => setHoveredId(entry.id)}
                onBlur={() => setHoveredId(null)}
              />
            )
          )}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="text-[11px] text-gray-400 dark:text-gray-500">
            {hovered ? hovered.label : centerTitle}
          </p>
          <p className="mt-0.5 max-w-[7.5rem] truncate text-sm font-bold text-gray-900 dark:text-gray-100">
            {formatMoney(hovered ? hovered.valuation : total, displayCurrency, usdKrw)}
          </p>
          {hovered && (
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              {hovered.ratio.toFixed(1)}%
            </p>
          )}
        </div>
      </div>

      <ul className="mt-4 flex flex-col gap-2.5">
        {entries.map((entry) => (
          <li
            key={entry.id}
            className="flex items-center justify-between text-sm"
            onMouseEnter={() => setHoveredId(entry.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <div className="flex items-center gap-2">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="font-medium text-gray-700 dark:text-gray-300">{entry.label}</span>
            </div>
            <div className="flex items-center gap-2 text-right">
              <span className="text-gray-400 dark:text-gray-500">
                {formatMoney(entry.valuation, displayCurrency, usdKrw)}
              </span>
              <span className="w-12 font-semibold text-gray-900 dark:text-gray-100">
                {entry.ratio.toFixed(1)}%
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
