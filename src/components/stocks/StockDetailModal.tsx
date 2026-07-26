"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Pencil, X } from "lucide-react";
import { StockAsset } from "@/lib/models/asset";
import { getStockSector, sectorColor } from "@/lib/models/stock-sector";
import { hexWithAlpha } from "@/lib/models/asset-owner";
import { formatMarketCap } from "@/lib/models/stock-valuation";
import { ClosePoint } from "@/lib/models/stock-history";
import { getAssetMetrics } from "@/lib/services/portfolio-service";
import { getRiskRows } from "@/lib/services/stock-risk-service";
import { formatPercent } from "@/lib/format";
import { useDisplayCurrency } from "@/lib/currency-context";
import { useSettings } from "@/lib/settings-context";
import { useAssetModal } from "@/lib/asset-modal-context";
import { useT } from "@/lib/i18n/locale-context";
import { useStockValuations } from "@/lib/hooks/use-stock-valuations";
import { useStockHistory } from "@/lib/hooks/use-stock-history";
import { Skeleton } from "@/components/common/Skeleton";

const RANGES = [
  { key: "1M", label: "1개월", days: 30 },
  { key: "3M", label: "3개월", days: 90 },
  { key: "1Y", label: "1년", days: 400 },
] as const;
type RangeKey = (typeof RANGES)[number]["key"];

const LINE = "#3182F6";
const H = 200;
const M = { top: 12, right: 12, bottom: 24, left: 8 };

function PriceChart({ closes, currency }: { closes: ClosePoint[]; currency: string }) {
  const [range, setRange] = useState<RangeKey>("3M");
  const { isAmountHidden } = useDisplayCurrency();
  const t = useT();
  const ref = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((e) => setWidth(e[0].contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const points = useMemo(() => {
    const days = RANGES.find((r) => r.key === range)!.days;
    const cutoff = new Date();
    cutoff.setUTCDate(cutoff.getUTCDate() - days);
    const key = cutoff.toISOString().slice(0, 10);
    return closes.filter((c) => c.date >= key);
  }, [closes, range]);

  const geo = useMemo(() => {
    if (points.length < 2 || width === 0) return null;
    const pw = width - M.left - M.right;
    const ph = H - M.top - M.bottom;
    const vals = points.map((p) => p.close);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const pad = (max - min || max || 1) * 0.08;
    const yMin = min - pad;
    const yMax = max + pad;
    const x = (i: number) => M.left + (i / (points.length - 1)) * pw;
    const y = (v: number) => M.top + ph - ((v - yMin) / (yMax - yMin)) * ph;
    const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.close).toFixed(1)}`).join("");
    const area = `${line}L${x(points.length - 1).toFixed(1)},${M.top + ph}L${x(0).toFixed(1)},${M.top + ph}Z`;
    const first = points[0].close;
    const last = points[points.length - 1].close;
    return { line, area, min, max, changePct: first === 0 ? 0 : ((last - first) / first) * 100 };
  }, [points, width]);

  const nativePrice = (n: number) =>
    isAmountHidden
      ? "•••"
      : currency === "USD"
        ? `$${n.toLocaleString("en-US", { maximumFractionDigits: n < 100 ? 2 : 0 })}`
        : `₩${Math.round(n).toLocaleString("ko-KR")}`;

  return (
    <div>
      <div className="flex items-center justify-between">
        {geo && (
          <p className={`text-xs font-medium ${geo.changePct >= 0 ? "text-rise" : "text-fall"}`}>
            {formatPercent(geo.changePct)}{" "}
            <span className="text-gray-400 dark:text-gray-500">
              · {t(RANGES.find((r) => r.key === range)!.label)}
            </span>
          </p>
        )}
        <div className="ml-auto flex gap-1 rounded-lg bg-gray-50 p-0.5 dark:bg-white/5">
          {RANGES.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setRange(key)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                range === key
                  ? "bg-white text-gray-900 shadow-sm dark:bg-white/15 dark:text-gray-100"
                  : "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              }`}
            >
              {t(label)}
            </button>
          ))}
        </div>
      </div>
      <div ref={ref} className="relative mt-2">
        {!geo ? (
          <p className="py-14 text-center text-sm text-gray-400 dark:text-gray-500">
            {t("차트 데이터가 없습니다.")}
          </p>
        ) : (
          <svg width={width} height={H} role="img" aria-label={t("가격 차트")} className="block">
            <text x={M.left} y={M.top + 4} className="fill-gray-400 text-[11px] dark:fill-gray-500">
              {nativePrice(geo.max)}
            </text>
            <text x={M.left} y={H - M.bottom} className="fill-gray-400 text-[11px] dark:fill-gray-500">
              {nativePrice(geo.min)}
            </text>
            <path d={geo.area} fill={LINE} fillOpacity={0.08} />
            <path d={geo.line} fill="none" stroke={LINE} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          </svg>
        )}
      </div>
    </div>
  );
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border p-3 dark:border-border-dark">
      <p className="text-[11px] text-gray-400 dark:text-gray-500">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-gray-900 [font-variant-numeric:tabular-nums] dark:text-gray-100">
        {value}
      </p>
    </div>
  );
}

/** Drill-down: holding P&L, price chart, risk & valuation for one stock. */
export default function StockDetailModal({ asset, onClose }: { asset: StockAsset; onClose: () => void }) {
  const { money, signedMoney, usdKrw, isAmountHidden } = useDisplayCurrency();
  const { ownerName, ownerColor } = useSettings();
  const { openEditModal } = useAssetModal();
  const t = useT();
  const { valuations, isLoading: vLoading } = useStockValuations([asset]);
  const { history, isLoading: hLoading } = useStockHistory([asset]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const key = asset.ticker?.trim().toUpperCase();
  const val = key ? valuations[key] : undefined;
  const closes = key ? history[key] ?? [] : [];
  const risk = getRiskRows([asset], history)[0];
  const { principal, valuation, profit, profitRate } = getAssetMetrics(asset, usdKrw);
  const owner = asset.owner ?? "JOINT";
  const sector = getStockSector(asset);
  const color = sectorColor(sector);

  const nativePrice = (n: number) =>
    isAmountHidden
      ? "•••"
      : (asset.currency ?? "KRW") === "USD"
        ? `$${n.toLocaleString("en-US", { maximumFractionDigits: n < 100 ? 2 : 0 })}`
        : `₩${Math.round(n).toLocaleString("ko-KR")}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <button type="button" aria-label={t("닫기")} onClick={onClose} className="absolute inset-0 bg-black/40" />
      <div className="relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-card-dark">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{asset.name}</h2>
              <span
                className="rounded px-1.5 py-0.5 text-[11px] font-semibold"
                style={{ color, backgroundColor: hexWithAlpha(color, 0.12) }}
              >
                {t(sector)}
              </span>
              <span
                className="rounded px-1.5 py-0.5 text-[11px] font-semibold"
                style={{ color: ownerColor(owner), backgroundColor: hexWithAlpha(ownerColor(owner), 0.12) }}
              >
                {ownerName(owner)}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
              {[asset.market, asset.ticker, asset.currency ?? "KRW"].filter(Boolean).join(" · ")}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label={t("수정")}
              onClick={() => {
                onClose();
                openEditModal(asset);
              }}
              className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10"
            >
              <Pencil size={16} />
            </button>
            <button
              type="button"
              aria-label={t("닫기")}
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Holding P&L */}
        <div className="mt-5 rounded-2xl bg-gray-50 p-4 dark:bg-white/5">
          <div className="flex items-baseline justify-between">
            <p className="text-xs font-medium text-gray-400 dark:text-gray-500">{t("평가 금액")}</p>
            <p className={`text-xs font-medium ${profit >= 0 ? "text-rise" : "text-fall"}`}>
              {signedMoney(profit)} ({formatPercent(profitRate)})
            </p>
          </div>
          <p className="mt-1 text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            {money(valuation)}
          </p>
          <div className="mt-3 grid grid-cols-4 gap-3 border-t border-border pt-3 text-xs dark:border-border-dark">
            <div>
              <p className="text-gray-400 dark:text-gray-500">{t("수량")}</p>
              <p className="mt-0.5 font-semibold text-gray-900 dark:text-gray-100">
                {t("{n}주", { n: asset.quantity.toLocaleString("ko-KR") })}
              </p>
            </div>
            <div>
              <p className="text-gray-400 dark:text-gray-500">{t("평단가")}</p>
              <p className="mt-0.5 font-semibold text-gray-900 dark:text-gray-100">{nativePrice(asset.avgPrice)}</p>
            </div>
            <div>
              <p className="text-gray-400 dark:text-gray-500">{t("현재가")}</p>
              <p className="mt-0.5 font-semibold text-gray-900 dark:text-gray-100">{nativePrice(asset.currentPrice)}</p>
            </div>
            <div>
              <p className="text-gray-400 dark:text-gray-500">{t("투자 원금")}</p>
              <p className="mt-0.5 font-semibold text-gray-900 dark:text-gray-100">{money(principal)}</p>
            </div>
          </div>
        </div>

        {/* Price chart */}
        <div className="mt-5">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t("가격 차트")}</p>
          {hLoading ? (
            <Skeleton className="mt-3 h-[200px] w-full rounded-xl" />
          ) : (
            <PriceChart closes={closes} currency={asset.currency ?? "KRW"} />
          )}
        </div>

        {/* Risk + valuation chips */}
        <div className="mt-5">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t("지표")}</p>
          {vLoading || hLoading ? (
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Chip label={t("52주 위치")} value={risk ? `${risk.position.toFixed(0)}%` : "-"} />
              <Chip label={t("변동성 (연율)")} value={risk ? `${risk.volatility.toFixed(1)}%` : "-"} />
              <Chip label={t("1년 수익률")} value={risk ? formatPercent(risk.return1y) : "-"} />
              <Chip label={t("최대 낙폭")} value={risk ? `${risk.maxDrawdown.toFixed(1)}%` : "-"} />
              <Chip label="PER" value={val?.per != null ? val.per.toFixed(1) : "-"} />
              <Chip label="PBR" value={val?.pbr != null ? val.pbr.toFixed(2) : "-"} />
              <Chip
                label={t("시가총액")}
                value={val?.marketCap != null ? formatMarketCap(val.marketCap, val.currency) : "-"}
              />
              <Chip
                label={t("배당수익률")}
                value={val?.dividendYield != null ? `${val.dividendYield.toFixed(2)}%` : "-"}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
