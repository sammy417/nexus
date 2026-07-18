"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Currency } from "@/lib/models/asset";
import { DEFAULT_USD_KRW } from "@/lib/services/portfolio-service";

const STORAGE_KEY = "nexus:display-currency";

interface CurrencyContextValue {
  /** Currency that dashboard/portfolio amounts are rendered in. */
  displayCurrency: Currency;
  setDisplayCurrency: (currency: Currency) => void;
  /** Live USDKRW rate (DEFAULT_USD_KRW until /api/fx responds or on failure). */
  usdKrw: number;
  /** False while the rate is still the offline fallback. */
  isFxLive: boolean;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [displayCurrency, setDisplayCurrencyState] = useState<Currency>("KRW");
  const [usdKrw, setUsdKrw] = useState<number>(DEFAULT_USD_KRW);
  const [isFxLive, setIsFxLive] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored === "USD" || stored === "KRW") setDisplayCurrencyState(stored);
    } catch {
      // ignore storage failures
    }

    fetch("/api/fx")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (data && typeof data.usdKrw === "number" && data.usdKrw > 0) {
          setUsdKrw(data.usdKrw);
          setIsFxLive(true);
        }
      })
      .catch(() => {
        // keep the fallback rate
      });
  }, []);

  const setDisplayCurrency = useCallback((currency: Currency) => {
    setDisplayCurrencyState(currency);
    try {
      window.localStorage.setItem(STORAGE_KEY, currency);
    } catch {
      // ignore storage failures
    }
  }, []);

  const value = useMemo(
    () => ({ displayCurrency, setDisplayCurrency, usdKrw, isFxLive }),
    [displayCurrency, setDisplayCurrency, usdKrw, isFxLive]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useDisplayCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useDisplayCurrency must be used within a CurrencyProvider");
  }
  return context;
}
