"use client";

import { useEffect, useRef, useState } from "react";
import { MonthlyDividend } from "@/lib/services/dividend-service";
import { useDisplayCurrency } from "@/lib/currency-context";

const BAR_COLOR = "#1baf7a";
const HEIGHT = 200;
const MARGIN = { top: 16, right: 8, bottom: 24, left: 52 };
const MAX_BAR_WIDTH = 24;

function niceTicks(max: number): number[] {
  if (max <= 0) return [0];
  const rawStep = max / 3;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const step =
    [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => max / s <= 4) ?? 10 * magnitude;
  const ticks: number[] = [];
  for (let v = 0; v <= max; v += step) ticks.push(v);
  return ticks;
}

/** Trailing 12 months of payouts as single-hue columns. */
export default function MonthlyDividendChart({ months }: { months: MonthlyDividend[] }) {
  const { money, compactMoney } = useDisplayCurrency();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);
  const [hovered, setHovered] = useState<number | null>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver((entries) => {
      setWidth(entries[0].contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const max = Math.max(...months.map((m) => m.totalKrw), 0);
  const hasData = width > 0 && max > 0;

  let content = null;
  if (hasData) {
    const yMax = max * 1.15;
    const plotWidth = width - MARGIN.left - MARGIN.right;
    const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
    const y = (v: number) => MARGIN.top + plotHeight - (v / yMax) * plotHeight;
    const slot = plotWidth / months.length;
    const barWidth = Math.min(MAX_BAR_WIDTH, slot * 0.55);
    const baseline = y(0);

    content = (
      <svg width={width} height={HEIGHT} role="img" aria-label="최근 12개월 월별 배당 막대 차트">
        {niceTicks(yMax).map((tick) => (
          <g key={tick}>
            <line
              x1={MARGIN.left}
              x2={width - MARGIN.right}
              y1={y(tick)}
              y2={y(tick)}
              strokeWidth={1}
              className={
                tick === 0
                  ? "stroke-gray-300 dark:stroke-gray-600"
                  : "stroke-border dark:stroke-border-dark"
              }
            />
            <text
              x={MARGIN.left - 8}
              y={y(tick)}
              textAnchor="end"
              dominantBaseline="middle"
              className="fill-gray-400 text-[11px] [font-variant-numeric:tabular-nums] dark:fill-gray-500"
            >
              {compactMoney(tick)}
            </text>
          </g>
        ))}

        {months.map((entry, index) => {
          const cx = MARGIN.left + slot * index + slot / 2;
          const top = y(entry.totalKrw);
          const barHeight = baseline - top;
          const r = Math.min(4, barWidth / 2, Math.max(barHeight, 0));

          return (
            <g key={entry.month}>
              <rect
                x={MARGIN.left + slot * index}
                y={MARGIN.top}
                width={slot}
                height={plotHeight}
                fill="transparent"
                onMouseEnter={() => setHovered(index)}
                onMouseLeave={() => setHovered(null)}
              />
              {entry.totalKrw > 0 && (
                <path
                  d={`M ${cx - barWidth / 2} ${baseline} V ${top + r} Q ${cx - barWidth / 2} ${top} ${cx - barWidth / 2 + r} ${top} H ${cx + barWidth / 2 - r} Q ${cx + barWidth / 2} ${top} ${cx + barWidth / 2} ${top + r} V ${baseline} Z`}
                  fill={BAR_COLOR}
                  opacity={hovered === null || hovered === index ? 1 : 0.45}
                  className="pointer-events-none transition-opacity"
                />
              )}
              {(index % 2 === 0 || months.length <= 8) && (
                <text
                  x={cx}
                  y={HEIGHT - 8}
                  textAnchor="middle"
                  className="fill-gray-400 text-[11px] dark:fill-gray-500"
                >
                  {entry.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    );
  }

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-card-dark">
      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">월별 배당</p>
      <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">최근 12개월 수령액 합계</p>
      <div ref={containerRef} className="relative mt-3">
        {!hasData ? (
          <p className="py-14 text-center text-sm text-gray-400 dark:text-gray-500">
            아직 기록된 배당이 없습니다.
          </p>
        ) : (
          <>
            {content}
            {hovered !== null && (
              <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 rounded-xl border border-border bg-white px-3 py-1.5 text-xs shadow-md dark:border-border-dark dark:bg-[#1E242C]">
                <span className="text-gray-400 dark:text-gray-500">{months[hovered].label} </span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {money(months[hovered].totalKrw)}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
