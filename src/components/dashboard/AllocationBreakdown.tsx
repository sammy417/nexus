"use client";

import { useState } from "react";
import { CategoryAllocationEntry } from "@/lib/services/portfolio-service";
import { formatMoney } from "@/lib/format";
import {
  PORTFOLIO_CATEGORY_COLOR,
  PORTFOLIO_CATEGORY_LABEL,
  PortfolioCategory,
} from "@/lib/models/portfolio-category";
import { useDisplayCurrency } from "@/lib/currency-context";

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

export default function AllocationBreakdown({
  allocation,
}: {
  allocation: CategoryAllocationEntry[];
}) {
  const { displayCurrency, usdKrw } = useDisplayCurrency();
  const [hoveredCategory, setHoveredCategory] = useState<PortfolioCategory | null>(null);

  if (allocation.length === 0) return null;

  const total = allocation.reduce((sum, entry) => sum + entry.valuation, 0);
  const hovered = allocation.find((entry) => entry.category === hoveredCategory) ?? null;

  // Segment sweep angles from ratio prefix sums, starting at 12 o'clock.
  const segments = allocation.map((entry, index) => {
    const before = allocation.slice(0, index).reduce((sum, e) => sum + e.ratio, 0);
    const start = -Math.PI / 2 + (before / 100) * Math.PI * 2;
    const end = start + (entry.ratio / 100) * Math.PI * 2;
    return { entry, start, end };
  });

  return (
    <section className="flex h-full flex-col rounded-2xl bg-white p-6 shadow-sm dark:bg-card-dark">
      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">자산 구성</p>

      <div className="relative mx-auto mt-2">
        <svg
          width={SIZE}
          height={SIZE}
          role="img"
          aria-label="자산 카테고리별 구성 비중 도넛 차트"
        >
          {segments.map(({ entry, start, end }) =>
            allocation.length === 1 ? (
              <circle
                key={entry.category}
                cx={CENTER}
                cy={CENTER}
                r={RADIUS}
                fill="none"
                stroke={PORTFOLIO_CATEGORY_COLOR[entry.category]}
                strokeWidth={hoveredCategory === entry.category ? HOVER_STROKE : STROKE}
              />
            ) : (
              <path
                key={entry.category}
                d={arcPath(start, end)}
                fill="none"
                stroke={PORTFOLIO_CATEGORY_COLOR[entry.category]}
                strokeWidth={hoveredCategory === entry.category ? HOVER_STROKE : STROKE}
                tabIndex={0}
                aria-label={`${PORTFOLIO_CATEGORY_LABEL[entry.category]} ${entry.ratio.toFixed(1)}%`}
                className="cursor-pointer outline-none transition-[stroke-width] duration-150"
                onMouseEnter={() => setHoveredCategory(entry.category)}
                onMouseLeave={() => setHoveredCategory(null)}
                onFocus={() => setHoveredCategory(entry.category)}
                onBlur={() => setHoveredCategory(null)}
              />
            )
          )}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="text-[11px] text-gray-400 dark:text-gray-500">
            {hovered ? PORTFOLIO_CATEGORY_LABEL[hovered.category] : "평가 금액 합계"}
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
        {allocation.map((entry) => (
          <li
            key={entry.category}
            className="flex items-center justify-between text-sm"
            onMouseEnter={() => setHoveredCategory(entry.category)}
            onMouseLeave={() => setHoveredCategory(null)}
          >
            <div className="flex items-center gap-2">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: PORTFOLIO_CATEGORY_COLOR[entry.category] }}
              />
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {PORTFOLIO_CATEGORY_LABEL[entry.category]}
              </span>
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
