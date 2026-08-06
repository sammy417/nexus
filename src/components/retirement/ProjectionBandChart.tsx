"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { HistoryPoint } from "@/lib/services/owner-history";
import type { RetirementProjection } from "@/lib/services/retirement-service";
import { useDisplayCurrency } from "@/lib/currency-context";
import { useT } from "@/lib/i18n/locale-context";

const HEIGHT = 260;
const MARGIN = { top: 16, right: 16, bottom: 30, left: 60 };

const ACTUAL = "#3182F6";
const BASE = "#8a63d2";
const BAND = "#8a63d2";
const GOAL = "#c98500";

/** ~4 clean-numbered ticks spanning [0, max]. */
function niceTicks(max: number): number[] {
  if (max <= 0) return [0];
  const rawStep = max / 3;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => max / s <= 4) ?? 10 * magnitude;
  const ticks: number[] = [];
  for (let v = 0; v <= max * 1.001; v += step) ticks.push(v);
  // The top tick must cover `max`, or a goal line above it gets clipped.
  if (ticks[ticks.length - 1] < max) ticks.push(ticks[ticks.length - 1] + step);
  return ticks;
}

function decimalYear(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return y + (m - 1) / 12 + (d - 1) / 365;
}

/**
 * The retirement trajectory: the actual (nominal) history on the left, then
 * three projected bands — conservative / base / optimistic — fanning out to
 * the retirement date, with a dashed line marking the nominal assets the plan
 * needs. Nominal throughout so the future connects continuously to the real
 * past; the headline figures on the summary card carry the today's-money view.
 */
export default function ProjectionBandChart({
  projection,
  history,
}: {
  projection: RetirementProjection;
  history: HistoryPoint[];
}) {
  const { compactMoney, money } = useDisplayCurrency();
  const t = useT();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => setWidth(entries[0].contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const geometry = useMemo(() => {
    if (width === 0 || projection.bandSeries.length < 2) return null;

    const now = new Date();
    const nowX = now.getUTCFullYear() + now.getUTCMonth() / 12;
    // Future points step one year from "now" so they connect to the history tail.
    const future = projection.bandSeries.map((p, i) => ({ ...p, x: nowX + i }));

    const actual = history
      .map((h) => ({ x: decimalYear(h.date), v: h.totalValuation }))
      .filter((p) => p.x <= nowX + 0.001);

    const xMin = actual.length > 0 ? Math.min(actual[0].x, nowX) : nowX;
    const xMax = future[future.length - 1].x;
    const yMaxRaw = Math.max(
      projection.neededNominalKrw,
      ...future.map((p) => p.optimisticKrw),
      ...actual.map((p) => p.v),
      1
    );
    const yTicks = niceTicks(yMaxRaw);
    const yMax = yTicks[yTicks.length - 1];

    const plotW = width - MARGIN.left - MARGIN.right;
    const plotH = HEIGHT - MARGIN.top - MARGIN.bottom;
    const x = (year: number) => MARGIN.left + ((year - xMin) / (xMax - xMin || 1)) * plotW;
    const y = (v: number) => MARGIN.top + plotH - (v / yMax) * plotH;

    const line = (pts: { x: number; v: number }[]) =>
      pts.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.x).toFixed(1)},${y(p.v).toFixed(1)}`).join("");

    const bandArea =
      future.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.x).toFixed(1)},${y(p.optimisticKrw).toFixed(1)}`).join("") +
      [...future].reverse().map((p) => `L${x(p.x).toFixed(1)},${y(p.conservativeKrw).toFixed(1)}`).join("") +
      "Z";

    // Age ticks along the x-axis (age is more meaningful than year here).
    const currentAge = projection.currentAge;
    const ageTicks: { x: number; age: number }[] = [];
    const span = xMax - xMin;
    const tickStep = span > 24 ? 10 : span > 10 ? 5 : 2;
    for (let age = Math.ceil(currentAge / tickStep) * tickStep; ; age += tickStep) {
      const xv = nowX + (age - currentAge);
      if (xv > xMax + 0.001) break;
      if (xv < xMin - 0.001) continue;
      ageTicks.push({ x: xv, age });
    }

    return {
      x,
      y,
      actualLine: actual.length >= 2 ? line(actual) : null,
      baseLine: line(future.map((p) => ({ x: p.x, v: p.baseKrw }))),
      bandArea,
      nowX,
      yTicks,
      ageTicks,
      retireX: future[future.length - 1].x,
    };
  }, [width, projection, history]);

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-card-dark">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t("자산 성장 시나리오")}</p>
          <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
            {t("과거 실제 자산과 은퇴 시점까지의 예상 경로 (명목 · 미래 금액 기준)")}
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-[11px] text-gray-500 dark:text-gray-400">
          <Legend color={ACTUAL} label={t("실제")} />
          <Legend color={BASE} label={t("예상(기본)")} />
          <Legend color={BAND} label={t("보수~낙관")} faded />
          <Legend color={GOAL} label={t("필요 자산")} dashed />
        </div>
      </div>

      <div ref={containerRef} className="mt-4">
        {!geometry ? (
          <p className="py-16 text-center text-sm text-gray-400 dark:text-gray-500">
            {t("추이를 표시할 데이터가 아직 부족합니다.")}
          </p>
        ) : (
          <svg width={width} height={HEIGHT} role="img" aria-label={t("자산 성장 시나리오")} className="block">
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
                  {compactMoney(tick)}
                </text>
              </g>
            ))}

            {geometry.ageTicks.map((tick) => (
              <text
                key={tick.age}
                x={geometry.x(tick.x)}
                y={HEIGHT - 8}
                textAnchor="middle"
                className="fill-gray-400 text-[11px] [font-variant-numeric:tabular-nums] dark:fill-gray-500"
              >
                {t("{age}세", { age: tick.age })}
              </text>
            ))}

            {/* Scenario band + base line (future). */}
            <path d={geometry.bandArea} fill={BAND} fillOpacity={0.12} />
            <path d={geometry.baseLine} fill="none" stroke={BASE} strokeWidth={2} strokeLinejoin="round" />

            {/* Actual history. */}
            {geometry.actualLine && (
              <path d={geometry.actualLine} fill="none" stroke={ACTUAL} strokeWidth={2} strokeLinejoin="round" />
            )}

            {/* "Now" divider. */}
            <line
              x1={geometry.x(geometry.nowX)}
              x2={geometry.x(geometry.nowX)}
              y1={MARGIN.top}
              y2={HEIGHT - MARGIN.bottom}
              className="stroke-gray-300 dark:stroke-gray-600"
              strokeWidth={1}
              strokeDasharray="3 3"
            />

            {/* Needed-assets goal line. */}
            {projection.neededNominalKrw > 0 && (
              <line
                x1={MARGIN.left}
                x2={width - MARGIN.right}
                y1={geometry.y(projection.neededNominalKrw)}
                y2={geometry.y(projection.neededNominalKrw)}
                stroke={GOAL}
                strokeWidth={1.5}
                strokeDasharray="5 4"
              />
            )}
          </svg>
        )}
      </div>

      {projection.neededNominalKrw > 0 && (
        <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
          {t("은퇴 시점 필요 자산(명목): {value}", { value: money(projection.neededNominalKrw) })}
        </p>
      )}
    </section>
  );
}

function Legend({
  color,
  label,
  faded,
  dashed,
}: {
  color: string;
  label: string;
  faded?: boolean;
  dashed?: boolean;
}) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        aria-hidden
        className="inline-block h-2 w-3 rounded-sm"
        style={{
          backgroundColor: dashed ? "transparent" : color,
          opacity: faded ? 0.25 : 1,
          borderBottom: dashed ? `2px dashed ${color}` : undefined,
        }}
      />
      {label}
    </span>
  );
}
