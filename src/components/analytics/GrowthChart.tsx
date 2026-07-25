"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { HistoryPoint } from "@/lib/services/owner-history";
import { formatCompactMoney, formatMoney } from "@/lib/format";
import { useDisplayCurrency } from "@/lib/currency-context";

const VALUATION_COLOR = "#3182F6";
const PRINCIPAL_COLOR = "#8b95a1";
const MARGIN = { top: 12, right: 12, bottom: 28, left: 56 };
const HEIGHT = 240;

function niceTicks(min: number, max: number): number[] {
  if (min === max) return [min];
  const span = max - min;
  const rawStep = span / 3;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const step =
    [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => span / s <= 4) ?? 10 * magnitude;
  const start = Math.ceil(min / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= max; v += step) ticks.push(v);
  return ticks;
}

function formatTickDate(date: string): string {
  const [, month, day] = date.split("-");
  return `${Number(month)}.${Number(day)}`;
}

/** 평가 금액 vs 투자 원금, full history — two lines with a shared crosshair. */
export default function GrowthChart({ snapshots }: { snapshots: HistoryPoint[] }) {
  const { displayCurrency, usdKrw } = useDisplayCurrency();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver((entries) => {
      setWidth(entries[0].contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const geometry = useMemo(() => {
    if (snapshots.length < 2 || width === 0) return null;

    const plotWidth = width - MARGIN.left - MARGIN.right;
    const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
    const values = snapshots.flatMap((s) => [s.totalValuation, s.totalPrincipal]);
    const rawMin = Math.min(...values);
    const rawMax = Math.max(...values);
    const pad = (rawMax - rawMin || rawMax || 1) * 0.08;
    const yMin = Math.max(0, rawMin - pad);
    const yMax = rawMax + pad;

    const x = (i: number) => MARGIN.left + (i / (snapshots.length - 1)) * plotWidth;
    const y = (v: number) => MARGIN.top + plotHeight - ((v - yMin) / (yMax - yMin)) * plotHeight;

    const linePath = (pick: (s: HistoryPoint) => number) =>
      snapshots
        .map((s, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(pick(s)).toFixed(1)}`)
        .join("");

    const tickCount = Math.min(4, snapshots.length);
    const xTickIndices = Array.from({ length: tickCount }, (_, i) =>
      Math.round((i / (tickCount - 1)) * (snapshots.length - 1))
    );

    return {
      x,
      y,
      valuationPath: linePath((s) => s.totalValuation),
      principalPath: linePath((s) => s.totalPrincipal),
      baseline: MARGIN.top + plotHeight,
      yTicks: niceTicks(yMin, yMax),
      xTickIndices,
    };
  }, [snapshots, width]);

  function handlePointerMove(event: React.PointerEvent<SVGSVGElement>) {
    if (!geometry) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - rect.left - MARGIN.left) / (width - MARGIN.left - MARGIN.right);
    const index = Math.round(ratio * (snapshots.length - 1));
    setHoverIndex(Math.max(0, Math.min(snapshots.length - 1, index)));
  }

  const hovered = hoverIndex !== null ? snapshots[hoverIndex] : null;
  const tooltipLeft =
    geometry && hoverIndex !== null
      ? Math.min(Math.max(geometry.x(hoverIndex) - 90, 4), width - 196)
      : 0;

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-card-dark">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">원금 대비 성장</p>
          <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
            전체 기간의 평가 금액과 투자 원금 추이
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded-full" style={{ backgroundColor: VALUATION_COLOR }} />
            평가 금액
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded-full" style={{ backgroundColor: PRINCIPAL_COLOR }} />
            투자 원금
          </span>
        </div>
      </div>

      <div ref={containerRef} className="relative mt-4">
        {!geometry ? (
          <p className="py-16 text-center text-sm text-gray-400 dark:text-gray-500">
            추이를 표시할 데이터가 아직 부족합니다.
          </p>
        ) : (
          <>
            <svg
              width={width}
              height={HEIGHT}
              role="img"
              aria-label="평가 금액과 투자 원금 추이 라인 차트"
              className="block touch-none"
              onPointerMove={handlePointerMove}
              onPointerLeave={() => setHoverIndex(null)}
            >
              {geometry.yTicks.map((tick) => (
                <g key={tick}>
                  <line
                    x1={MARGIN.left}
                    x2={width - MARGIN.right}
                    y1={geometry.y(tick)}
                    y2={geometry.y(tick)}
                    className="stroke-border dark:stroke-border-dark"
                    strokeWidth={1}
                  />
                  <text
                    x={MARGIN.left - 8}
                    y={geometry.y(tick)}
                    textAnchor="end"
                    dominantBaseline="middle"
                    className="fill-gray-400 text-[11px] [font-variant-numeric:tabular-nums] dark:fill-gray-500"
                  >
                    {formatCompactMoney(tick, displayCurrency, usdKrw)}
                  </text>
                </g>
              ))}

              {geometry.xTickIndices.map((index) => (
                <text
                  key={index}
                  x={geometry.x(index)}
                  y={HEIGHT - 8}
                  textAnchor="middle"
                  className="fill-gray-400 text-[11px] [font-variant-numeric:tabular-nums] dark:fill-gray-500"
                >
                  {formatTickDate(snapshots[index].date)}
                </text>
              ))}

              <path
                d={geometry.principalPath}
                fill="none"
                stroke={PRINCIPAL_COLOR}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              <path
                d={geometry.valuationPath}
                fill="none"
                stroke={VALUATION_COLOR}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {hoverIndex !== null && hovered && (
                <g>
                  <line
                    x1={geometry.x(hoverIndex)}
                    x2={geometry.x(hoverIndex)}
                    y1={MARGIN.top}
                    y2={geometry.baseline}
                    className="stroke-gray-300 dark:stroke-gray-600"
                    strokeWidth={1}
                  />
                  {[
                    { value: hovered.totalValuation, color: VALUATION_COLOR },
                    { value: hovered.totalPrincipal, color: PRINCIPAL_COLOR },
                  ].map(({ value, color }) => (
                    <g key={color}>
                      <circle
                        cx={geometry.x(hoverIndex)}
                        cy={geometry.y(value)}
                        r={6}
                        className="fill-white dark:fill-card-dark"
                      />
                      <circle cx={geometry.x(hoverIndex)} cy={geometry.y(value)} r={4} fill={color} />
                    </g>
                  ))}
                </g>
              )}
            </svg>

            {hovered && (
              <div
                className="pointer-events-none absolute top-0 w-48 rounded-xl border border-border bg-white px-3 py-2 shadow-md dark:border-border-dark dark:bg-[#1E242C]"
                style={{ left: tooltipLeft }}
              >
                <p className="text-[11px] text-gray-400 dark:text-gray-500">{hovered.date}</p>
                <p className="mt-1 flex items-center justify-between gap-2 text-xs">
                  <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                    <span
                      className="h-0.5 w-3 rounded-full"
                      style={{ backgroundColor: VALUATION_COLOR }}
                    />
                    평가
                  </span>
                  <span className="font-semibold text-gray-900 [font-variant-numeric:tabular-nums] dark:text-gray-100">
                    {formatMoney(hovered.totalValuation, displayCurrency, usdKrw)}
                  </span>
                </p>
                <p className="mt-0.5 flex items-center justify-between gap-2 text-xs">
                  <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                    <span
                      className="h-0.5 w-3 rounded-full"
                      style={{ backgroundColor: PRINCIPAL_COLOR }}
                    />
                    원금
                  </span>
                  <span className="font-semibold text-gray-900 [font-variant-numeric:tabular-nums] dark:text-gray-100">
                    {formatMoney(hovered.totalPrincipal, displayCurrency, usdKrw)}
                  </span>
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
