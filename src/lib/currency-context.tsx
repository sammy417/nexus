"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Currency } from "@/lib/models/asset";
import { formatCompactMoney, formatMoney, formatSignedMoney } from "@/lib/format";
import { DEFAULT_USD_KRW } from "@/lib/services/portfolio-service";

const STORAGE_KEY = "nexus:display-currency";
const PRIVACY_KEY = "nexus:amount-hidden";

/** Shown in place of amounts while privacy mode is on. */
const MASK = "•••••";
const MASK_COMPACT = "•••";

interface CurrencyContextValue {
  /** Currency that dashboard/portfolio amounts are rendered in. */
  displayCurrency: Currency;
  setDisplayCurrency: (currency: Currency) => void;
  /** Live USDKRW rate (DEFAULT_USD_KRW until /api/fx responds or on failure). */
  usdKrw: number;
  /** False while the rate is still the offline fallback. */
  isFxLive: boolean;
  /** Privacy mode: replace every rendered amount with a mask. */
  isAmountHidden: boolean;
  toggleAmountHidden: () => void;
  /** A KRW-base amount in the display currency, masked when privacy is on. */
  money: (valueKrw: number) => string;
  /** Signed variant of `money` (평가 손익 등). */
  signedMoney: (valueKrw: number) => string;
  /** Compact variant for chart axis ticks / tooltips. */
  compactMoney: (valueKrw: number) => string;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [displayCurrency, setDisplayCurrencyState] = useState<Currency>("KRW");
  const [usdKrw, setUsdKrw] = useState<number>(DEFAULT_USD_KRW);
  const [isFxLive, setIsFxLive] = useState(false);
  const [isAmountHidden, setIsAmountHidden] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored === "USD" || stored === "KRW") setDisplayCurrencyState(stored);
      if (window.localStorage.getItem(PRIVACY_KEY) === "1") setIsAmountHidden(true);
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

  const toggleAmountHidden = useCallback(() => {
    setIsAmountHidden((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(PRIVACY_KEY, next ? "1" : "0");
      } catch {
        // ignore storage failures
      }
      return next;
    });
  }, []);

  const money = useCallback(
    (valueKrw: number) => (isAmountHidden ? MASK : formatMoney(valueKrw, displayCurrency, usdKrw)),
    [isAmountHidden, displayCurrency, usdKrw]
  );
  const signedMoney = useCallback(
    (valueKrw: number) =>
      isAmountHidden ? MASK : formatSignedMoney(valueKrw, displayCurrency, usdKrw),
    [isAmountHidden, displayCurrency, usdKrw]
  );
  const compactMoney = useCallback(
    (valueKrw: number) =>
      isAmountHidden ? MASK_COMPACT : formatCompactMoney(valueKrw, displayCurrency, usdKrw),
    [isAmountHidden, displayCurrency, usdKrw]
  );

  const value = useMemo(
    () => ({
      displayCurrency,
      setDisplayCurrency,
      usdKrw,
      isFxLive,
      isAmountHidden,
      toggleAmountHidden,
      money,
      signedMoney,
      compactMoney,
    }),
    [
      displayCurrency,
      setDisplayCurrency,
      usdKrw,
      isFxLive,
      isAmountHidden,
      toggleAmountHidden,
      money,
      signedMoney,
      compactMoney,
    ]
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
