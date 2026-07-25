"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { HistoryPoint } from "@/lib/services/owner-history";
import { formatCompactMoney, formatMoney, formatPercent, formatSignedMoney } from "@/lib/format";
import { useDisplayCurrency } from "@/lib/currency-context";

const LINE_COLOR = "#3182F6";
const MARGIN = { top: 12, right: 12, bottom: 28, left: 56 };
const HEIGHT = 240;

const RANGES = [
  { key: "1M", label: "1개월", days: 30 },
  { key: "3M", label: "3개월", days: 90 },
  { key: "ALL", label: "전체", days: Infinity },
] as const;

type RangeKey = (typeof RANGES)[number]["key"];

/** ~4 clean-numbered y ticks spanning [min, max]. */
function niceTicks(min: number, max: number): number[] {
  if (min === max) {
    return [min];
  }
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

function formatFullDate(date: string): string {
  const [year, month, day] = date.split("-");
  return `${year}년 ${Number(month)}월 ${Number(day)}일`;
}

export default function TrendChart({ snapshots }: { snapshots: HistoryPoint[] }) {
  const { displayCurrency, usdKrw } = useDisplayCurrency();
  const [range, setRange] = useState<RangeKey>("1M");
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver((entries) => {
      setWidth(entries[0].contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const points = useMemo(() => {
    const selected = RANGES.find((r) => r.key === range)!;
    if (!Number.isFinite(selected.days)) return snapshots;
    const cutoff = new Date();
    cutoff.setUTCDate(cutoff.getUTCDate() - selected.days);
    const cutoffKey = cutoff.toISOString().slice(0, 10);
    return snapshots.filter((snapshot) => snapshot.date >= cutoffKey);
  }, [snapshots, range]);

  const geometry = useMemo(() => {
    if (points.length < 2 || width === 0) return null;

    const plotWidth = width - MARGIN.left - MARGIN.right;
    const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
    const values = points.map((p) => p.totalValuation);
    const rawMin = Math.min(...values);
    const rawMax = Math.max(...values);
    const pad = (rawMax - rawMin || rawMax || 1) * 0.08;
    const yMin = Math.max(0, rawMin - pad);
    const yMax = rawMax + pad;

    const x = (i: number) => MARGIN.left + (i / (points.length - 1)) * plotWidth;
    const y = (v: number) =>
      MARGIN.top + plotHeight - ((v - yMin) / (yMax - yMin)) * plotHeight;

    const linePath = points
      .map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.totalValuation).toFixed(1)}`)
      .join("");
    const baseline = MARGIN.top + plotHeight;
    const areaPath = `${linePath}L${x(points.length - 1).toFixed(1)},${baseline}L${x(0).toFixed(
      1
    )},${baseline}Z`;

    const tickCount = Math.min(4, points.length);
    const xTickIndices = Array.from({ length: tickCount }, (_, i) =>
      Math.round((i / (tickCount - 1)) * (points.length - 1))
    );

    return { x, y, linePath, areaPath, baseline, yTicks: niceTicks(yMin, yMax), xTickIndices };
  }, [points, width]);

  const rangeSummary = useMemo(() => {
    if (points.length < 2) return null;
    const first = points[0].totalValuation;
    const last = points[points.length - 1].totalValuation;
    const diff = last - first;
    const rate = first === 0 ? 0 : (diff / first) * 100;
    return { diff, rate };
  }, [points]);

  function handlePointerMove(event: React.PointerEvent<SVGSVGElement>) {
    if (!geometry || points.length < 2) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const px = event.clientX - rect.left;
    const plotWidth = width - MARGIN.left - MARGIN.right;
    const ratio = (px - MARGIN.left) / plotWidth;
    const index = Math.round(ratio * (points.length - 1));
    setHoverIndex(Math.max(0, Math.min(points.length - 1, index)));
  }

  function handleKeyDown(event: React.KeyboardEvent<SVGSVGElement>) {
    if (points.length < 2) return;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      const delta = event.key === "ArrowLeft" ? -1 : 1;
      setHoverIndex((prev) => {
        const base = prev ?? points.length - 1;
        return Math.max(0, Math.min(points.length - 1, base + delta));
      });
    } else if (event.key === "Escape") {
      setHoverIndex(null);
    }
  }

  const hovered = hoverIndex !== null ? points[hoverIndex] : null;
  const hoveredPrev = hoverIndex !== null && hoverIndex > 0 ? points[hoverIndex - 1] : null;
  const hoveredDelta =
    hovered && hoveredPrev ? hovered.totalValuation - hoveredPrev.totalValuation : null;

  const tooltipLeft =
    geometry && hoverIndex !== null
      ? Math.min(Math.max(geometry.x(hoverIndex) - 80, 4), width - 176)
      : 0;

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-card-dark">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">총 자산 추이</p>
          {rangeSummary && (
            <p
              className={`mt-1 text-xs font-medium ${
                rangeSummary.diff >= 0 ? "text-rise" : "text-fall"
              }`}
            >
              {formatSignedMoney(rangeSummary.diff, displayCurrency, usdKrw)} ({formatPercent(rangeSummary.rate)})
              <span className="ml-1 text-gray-400 dark:text-gray-500">
                · {RANGES.find((r) => r.key === range)!.label}
              </span>
            </p>
          )}
        </div>
        <div className="flex gap-1 rounded-lg bg-gray-50 p-0.5 dark:bg-white/5">
          {RANGES.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setRange(key);
                setHoverIndex(null);
              }}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                range === key
                  ? "bg-white text-gray-900 shadow-sm dark:bg-white/15 dark:text-gray-100"
                  : "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              }`}
            >
              {label}
            </button>
          ))}
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
              aria-label="총 자산 평가 금액 추이 라인 차트"
              tabIndex={0}
              className="block touch-none outline-none focus-visible:ring-2 focus-visible:ring-fall/40"
              onPointerMove={handlePointerMove}
              onPointerLeave={() => setHoverIndex(null)}
              onKeyDown={handleKeyDown}
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
                  {formatTickDate(points[index].date)}
                </text>
              ))}

              <path d={geometry.areaPath} fill={LINE_COLOR} fillOpacity={0.08} />
              <path
                d={geometry.linePath}
                fill="none"
                stroke={LINE_COLOR}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {hoverIndex !== null && (
                <g>
                  <line
                    x1={geometry.x(hoverIndex)}
                    x2={geometry.x(hoverIndex)}
                    y1={MARGIN.top}
                    y2={geometry.baseline}
                    className="stroke-gray-300 dark:stroke-gray-600"
                    strokeWidth={1}
                  />
                  <circle
                    cx={geometry.x(hoverIndex)}
                    cy={geometry.y(points[hoverIndex].totalValuation)}
                    r={6}
                    className="fill-white dark:fill-card-dark"
                  />
                  <circle
                    cx={geometry.x(hoverIndex)}
                    cy={geometry.y(points[hoverIndex].totalValuation)}
                    r={4}
                    fill={LINE_COLOR}
                  />
                </g>
              )}
            </svg>

            {hovered && (
              <div
                className="pointer-events-none absolute top-0 w-44 rounded-xl border border-border bg-white px-3 py-2 shadow-md dark:border-border-dark dark:bg-[#1E242C]"
                style={{ left: tooltipLeft }}
              >
                <p className="text-[11px] text-gray-400 dark:text-gray-500">
                  {formatFullDate(hovered.date)}
                </p>
                <p className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-gray-100">
                  <span
                    aria-hidden
                    className="inline-block h-0.5 w-3 rounded-full"
                    style={{ backgroundColor: LINE_COLOR }}
                  />
                  {formatMoney(hovered.totalValuation, displayCurrency, usdKrw)}
                </p>
                {hoveredDelta !== null && (
                  <p
                    className={`mt-0.5 text-[11px] font-medium ${
                      hoveredDelta >= 0 ? "text-rise" : "text-fall"
                    }`}
                  >
                    전일 대비 {formatSignedMoney(hoveredDelta, displayCurrency, usdKrw)}
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {points.length >= 2 && (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs font-medium text-gray-400 transition-colors hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300">
            표로 보기
          </summary>
          <div className="mt-2 max-h-56 overflow-y-auto rounded-xl border border-border dark:border-border-dark">
            <table className="w-full text-xs [font-variant-numeric:tabular-nums]">
              <thead className="sticky top-0 bg-gray-50 dark:bg-[#1E242C]">
                <tr className="text-left text-gray-400 dark:text-gray-500">
                  <th className="px-3 py-2 font-medium">날짜</th>
                  <th className="px-3 py-2 text-right font-medium">평가 금액</th>
                  <th className="px-3 py-2 text-right font-medium">투자 원금</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                {[...points].reverse().map((snapshot) => (
                  <tr key={snapshot.date}>
                    <td className="px-3 py-1.5 text-gray-500 dark:text-gray-400">{snapshot.date}</td>
                    <td className="px-3 py-1.5 text-right text-gray-700 dark:text-gray-300">
                      {formatMoney(snapshot.totalValuation, displayCurrency, usdKrw)}
                    </td>
                    <td className="px-3 py-1.5 text-right text-gray-700 dark:text-gray-300">
                      {formatMoney(snapshot.totalPrincipal, displayCurrency, usdKrw)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </section>
  );
}
