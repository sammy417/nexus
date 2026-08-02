"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AssetOwner } from "@/lib/models/asset";
import { AppSettings, DEFAULT_SETTINGS } from "@/lib/models/settings";
import type { TargetAllocationSettings } from "@/lib/models/target-allocation";

interface SettingsContextValue {
  settings: AppSettings;
  /** Custom (or default) display name for an owner tag. */
  ownerName: (owner: AssetOwner) => string;
  /** Custom (or default) hex color for an owner tag. */
  ownerColor: (owner: AssetOwner) => string;
  /** Target allocation + drift band (falls back to the default set). */
  targetAllocation: TargetAllocationSettings;
  /** Persist new settings to the server and update local state. */
  save: (settings: AppSettings) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/settings")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!cancelled && data) setSettings(data);
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

  const value = useMemo(
    () => ({ settings, ownerName, ownerColor, targetAllocation, save }),
    [settings, ownerName, ownerColor, targetAllocation, save]
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
