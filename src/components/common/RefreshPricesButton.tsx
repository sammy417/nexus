"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { usePortfolio } from "@/lib/portfolio-context";
import { useAssetModal } from "@/lib/asset-modal-context";
import type { RefreshPricesResult } from "@/lib/services/refresh-prices-service";

const LAST_REFRESH_KEY = "nexus:prices-refreshed-at";
const AUTO_SESSION_KEY = "nexus:prices-auto-done";

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/**
 * Re-quotes every held stock ticker. Manual on click, plus one silent
 * auto-run per browser session on first mount (guarded by sessionStorage
 * so navigating between pages doesn't re-trigger it).
 */
export default function RefreshPricesButton() {
  const { refreshData } = usePortfolio();
  const { showToast } = useAssetModal();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);
  const didAuto = useRef(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(LAST_REFRESH_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored) setLastRefresh(stored);
    } catch {
      // ignore
    }
  }, []);

  const run = useCallback(
    async (silent: boolean) => {
      setIsRefreshing(true);
      try {
        const response = await fetch("/api/assets/refresh-prices", { method: "POST" });
        if (!response.ok) throw new Error();
        const result = (await response.json()) as RefreshPricesResult;

        try {
          window.localStorage.setItem(LAST_REFRESH_KEY, result.refreshedAt);
        } catch {
          // ignore
        }
        setLastRefresh(result.refreshedAt);

        if (result.updated > 0) await refreshData();

        if (!silent || result.updated > 0) {
          const failNote = result.failed.length > 0 ? ` · 실패 ${result.failed.length}건` : "";
          showToast(
            result.checked === 0
              ? "시세를 조회할 주식이 없습니다."
              : `시세 갱신: ${result.updated}개 업데이트${failNote}`
          );
        }
      } catch {
        if (!silent) showToast("시세 갱신에 실패했습니다. 잠시 후 다시 시도해 주세요.");
      } finally {
        setIsRefreshing(false);
      }
    },
    [refreshData, showToast]
  );

  useEffect(() => {
    if (didAuto.current) return;
    didAuto.current = true;
    let alreadyDone = false;
    try {
      alreadyDone = window.sessionStorage.getItem(AUTO_SESSION_KEY) === "1";
      window.sessionStorage.setItem(AUTO_SESSION_KEY, "1");
    } catch {
      // ignore
    }
    if (!alreadyDone) run(true);
  }, [run]);

  return (
    <div className="flex items-center gap-2">
      {lastRefresh && !isRefreshing && (
        <span className="text-[11px] text-gray-400 dark:text-gray-500">
          {formatTime(lastRefresh)} 갱신
        </span>
      )}
      <button
        type="button"
        onClick={() => run(false)}
        disabled={isRefreshing}
        aria-label="시세 새로고침"
        className="flex items-center gap-1.5 rounded-lg bg-gray-50 px-2.5 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:text-gray-700 disabled:opacity-60 dark:bg-white/5 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <RefreshCw size={13} className={isRefreshing ? "animate-spin" : ""} />
        {isRefreshing ? "갱신 중" : "시세"}
      </button>
    </div>
  );
}
