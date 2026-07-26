"use client";

import { useEffect, useRef, useState } from "react";
import { MonthlyReturn } from "@/lib/services/analytics-service";
import { formatPercent } from "@/lib/format";
import { useT } from "@/lib/i18n/locale-context";

const HEIGHT = 200;
const MARGIN = { top: 16, right: 8, bottom: 24, left: 44 };
const MAX_BAR_WIDTH = 24;

/** ~3 clean percent ticks covering [min, max] including 0. */
function percentTicks(min: number, max: number): number[] {
  const span = Math.max(max, 0) - Math.min(min, 0) || 1;
  const rawStep = span / 3;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const step =
    [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => span / s <= 4) ?? 10 * magnitude;
  const ticks: number[] = [];
  for (let v = Math.ceil(Math.min(min, 0) / step) * step; v <= Math.max(max, 0); v += step) {
    ticks.push(Math.abs(v) < 1e-9 ? 0 : v);
  }
  return ticks;
}

/** Monthly valuation change columns; sign carries the rise/fall polarity color. */
export default function MonthlyReturnsChart({ returns }: { returns: MonthlyReturn[] }) {
  const t = useT();
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

  const hasData = returns.length > 0 && width > 0;

  let content = null;
  if (hasData) {
    const values = returns.map((r) => r.returnRate);
    const min = Math.min(...values, 0);
    const max = Math.max(...values, 0);
    const pad = (max - min || 1) * 0.15;
    const yMin = min < 0 ? min - pad : 0;
    const yMax = max > 0 ? max + pad : 0;

    const plotWidth = width - MARGIN.left - MARGIN.right;
    const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
    const y = (v: number) => MARGIN.top + plotHeight - ((v - yMin) / (yMax - yMin)) * plotHeight;
    const slot = plotWidth / returns.length;
    const barWidth = Math.min(MAX_BAR_WIDTH, slot * 0.5);
    const zeroY = y(0);

    content = (
      <svg width={width} height={HEIGHT} role="img" aria-label="월별 수익률 막대 차트">
        {percentTicks(yMin, yMax).map((tick) => (
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
              {tick > 0 ? `+${tick}%` : `${tick}%`}
            </text>
          </g>
        ))}

        {returns.map((entry, index) => {
          const cx = MARGIN.left + slot * index + slot / 2;
          const positive = entry.returnRate >= 0;
          const barTop = positive ? y(entry.returnRate) : zeroY;
          const barHeight = Math.max(Math.abs(y(entry.returnRate) - zeroY), 1.5);
          const r = Math.min(4, barWidth / 2, barHeight);
          // 4px rounded data-end, square at the zero baseline.
          const path = positive
            ? `M ${cx - barWidth / 2} ${zeroY} V ${barTop + r} Q ${cx - barWidth / 2} ${barTop} ${cx - barWidth / 2 + r} ${barTop} H ${cx + barWidth / 2 - r} Q ${cx + barWidth / 2} ${barTop} ${cx + barWidth / 2} ${barTop + r} V ${zeroY} Z`
            : `M ${cx - barWidth / 2} ${zeroY} V ${barTop + barHeight - r} Q ${cx - barWidth / 2} ${barTop + barHeight} ${cx - barWidth / 2 + r} ${barTop + barHeight} H ${cx + barWidth / 2 - r} Q ${cx + barWidth / 2} ${barTop + barHeight} ${cx + barWidth / 2} ${barTop + barHeight - r} V ${zeroY} Z`;

          return (
            <g key={entry.month}>
              {/* transparent hit area wider than the mark */}
              <rect
                x={MARGIN.left + slot * index}
                y={MARGIN.top}
                width={slot}
                height={plotHeight}
                fill="transparent"
                onMouseEnter={() => setHovered(index)}
                onMouseLeave={() => setHovered(null)}
              />
              <path
                d={path}
                fill={positive ? "#F04452" : "#3182F6"}
                opacity={hovered === null || hovered === index ? 1 : 0.45}
                className="pointer-events-none transition-opacity"
              />
              <text
                x={cx}
                y={HEIGHT - 8}
                textAnchor="middle"
                className="fill-gray-400 text-[11px] dark:fill-gray-500"
              >
                {entry.label}
              </text>
            </g>
          );
        })}
      </svg>
    );
  }

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-card-dark">
      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t("월별 수익률")}</p>
      <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
        {t("각 월 말 평가 금액의 전월 대비 변화율")}
      </p>
      <div ref={containerRef} className="relative mt-3">
        {!hasData ? (
          <p className="py-14 text-center text-sm text-gray-400 dark:text-gray-500">
            {t("비교할 월별 데이터가 아직 부족합니다.")}
          </p>
        ) : (
          <>
            {content}
            {hovered !== null && (
              <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 rounded-xl border border-border bg-white px-3 py-1.5 text-xs shadow-md dark:border-border-dark dark:bg-[#1E242C]">
                <span className="text-gray-400 dark:text-gray-500">{returns[hovered].label} </span>
                <span
                  className={`font-semibold ${
                    returns[hovered].returnRate >= 0 ? "text-rise" : "text-fall"
                  }`}
                >
                  {formatPercent(returns[hovered].returnRate)}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
