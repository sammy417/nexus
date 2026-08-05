"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AssetOwner } from "@/lib/models/asset";
import { AppSettings, DEFAULT_SETTINGS } from "@/lib/models/settings";
import type { TargetAllocationSettings } from "@/lib/models/target-allocation";
import {
  currentTaxYear,
  getTaxInputs,
  TaxYearInputs,
  withTaxInputs,
} from "@/lib/models/tax-inputs";

interface SettingsContextValue {
  settings: AppSettings;
  /** Custom (or default) display name for an owner tag. */
  ownerName: (owner: AssetOwner) => string;
  /** Custom (or default) hex color for an owner tag. */
  ownerColor: (owner: AssetOwner) => string;
  /** Target allocation + drift band (falls back to the default set). */
  targetAllocation: TargetAllocationSettings;
  /** This owner's manual tax figures for the current year. */
  taxInputs: (owner: AssetOwner) => TaxYearInputs;
  /** Patch one owner's tax figures — applied locally at once, saved shortly after. */
  updateTaxInputs: (owner: AssetOwner, patch: Partial<TaxYearInputs>) => void;
  /** Persist new settings to the server and update local state. */
  save: (settings: AppSettings) => Promise<void>;
}

/**
 * Tax figures are typed a digit at a time, so writes are coalesced instead
 * of firing a PUT per keystroke.
 */
const TAX_INPUT_SAVE_DELAY_MS = 700;

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  // Latest settings to persist, plus the timer coalescing the writes.
  const pendingRef = useRef<AppSettings | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/settings")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        // A stored edit made before this landed is the newer truth — don't
        // let the initial load overwrite what the user just typed.
        if (!cancelled && data && !pendingRef.current) setSettings(data);
      })
      .catch(() => {
        // keep defaults
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const save = useCallback(async (next: AppSettings) => {
    const response = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    if (!response.ok) throw new Error("설정 저장에 실패했습니다.");
    setSettings(await response.json());
  }, []);

  const ownerName = useCallback(
    (owner: AssetOwner) => settings.ownerNames[owner] ?? DEFAULT_SETTINGS.ownerNames[owner],
    [settings]
  );

  const ownerColor = useCallback(
    (owner: AssetOwner) => settings.ownerColors?.[owner] ?? DEFAULT_SETTINGS.ownerColors[owner],
    [settings]
  );

  const targetAllocation = settings.targetAllocation ?? DEFAULT_SETTINGS.targetAllocation;

  const taxInputs = useCallback(
    (owner: AssetOwner) => getTaxInputs(settings.taxInputs, currentTaxYear(), owner),
    [settings]
  );

  const flushTaxInputs = useCallback(() => {
    const next = pendingRef.current;
    pendingRef.current = null;
    if (!next) return;
    // Deliberately not applying the response: the user may have typed more
    // since this request left, and the local state is the newer truth.
    fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    }).catch(() => {
      // Offline/failed save — the figures stay on screen and the next
      // keystroke schedules another attempt.
    });
  }, []);

  const updateTaxInputs = useCallback(
    (owner: AssetOwner, patch: Partial<TaxYearInputs>) => {
      setSettings((prev) => {
        const next: AppSettings = {
          ...prev,
          taxInputs: withTaxInputs(prev.taxInputs, currentTaxYear(), owner, patch),
        };
        pendingRef.current = next;
        return next;
      });
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(flushTaxInputs, TAX_INPUT_SAVE_DELAY_MS);
    },
    [flushTaxInputs]
  );

  // Don't lose the last keystrokes when the page goes away mid-debounce.
  useEffect(() => {
    const flushNow = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      flushTaxInputs();
    };
    window.addEventListener("pagehide", flushNow);
    return () => {
      window.removeEventListener("pagehide", flushNow);
      flushNow();
    };
  }, [flushTaxInputs]);

  const value = useMemo(
    () => ({
      settings,
      ownerName,
      ownerColor,
      targetAllocation,
      taxInputs,
      updateTaxInputs,
      save,
    }),
    [settings, ownerName, ownerColor, targetAllocation, taxInputs, updateTaxInputs, save]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
