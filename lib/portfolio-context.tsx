"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { holdings as seedHoldings } from "./dummy-data";
import { getPortfolioSummary, PortfolioSummary } from "./portfolio";
import { Holding, TradeType } from "./types";

const STORAGE_KEY = "nexus:holdings";

export interface AddTradeInput {
  stockName: string;
  type: TradeType;
  price: number;
  quantity: number;
}

export type AddTradeResult = { ok: true } | { ok: false; message: string };

interface PortfolioContextValue {
  holdings: Holding[];
  summary: PortfolioSummary;
  addTrade: (input: AddTradeInput) => AddTradeResult;
  resetPortfolio: () => void;
}

const PortfolioContext = createContext<PortfolioContextValue | null>(null);

function loadStoredHoldings(): Holding[] | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
  const [holdings, setHoldings] = useState<Holding[]>(seedHoldings);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Seed state is used for the SSR/hydration render to avoid a mismatch;
    // localStorage is only readable client-side, so it's applied post-mount.
    const stored = loadStoredHoldings();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored) setHoldings(stored);
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(holdings));
  }, [holdings, isHydrated]);

  function addTrade({ stockName, type, price, quantity }: AddTradeInput): AddTradeResult {
    const index = holdings.findIndex((h) => h.name === stockName);

    if (type === "BUY") {
      if (index === -1) {
        const newHolding: Holding = {
          id: crypto.randomUUID(),
          name: stockName,
          quantity,
          avgPrice: price,
          currentPrice: price,
        };
        setHoldings([newHolding, ...holdings]);
        return { ok: true };
      }

      const target = holdings[index];
      const totalQuantity = target.quantity + quantity;
      const avgPrice = (target.avgPrice * target.quantity + price * quantity) / totalQuantity;
      setHoldings(
        holdings.map((h, i) => (i === index ? { ...h, quantity: totalQuantity, avgPrice } : h))
      );
      return { ok: true };
    }

    // SELL
    if (index === -1 || holdings[index].quantity < quantity) {
      return { ok: false, message: "보유 수량이 부족하여 매도할 수 없습니다." };
    }

    const remaining = holdings[index].quantity - quantity;
    setHoldings(
      remaining === 0
        ? holdings.filter((_, i) => i !== index)
        : holdings.map((h, i) => (i === index ? { ...h, quantity: remaining } : h))
    );
    return { ok: true };
  }

  function resetPortfolio() {
    setHoldings(seedHoldings);
  }

  const summary = getPortfolioSummary(holdings);

  return (
    <PortfolioContext.Provider value={{ holdings, summary, addTrade, resetPortfolio }}>
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error("usePortfolio must be used within a PortfolioProvider");
  }
  return context;
}
