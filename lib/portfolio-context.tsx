"use client";

import { createContext, useContext, useState } from "react";
import { holdings as seedHoldings } from "./dummy-data";
import { getPortfolioSummary, PortfolioSummary } from "./portfolio";
import { Holding, TradeType } from "./types";

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
}

const PortfolioContext = createContext<PortfolioContextValue | null>(null);

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
  const [holdings, setHoldings] = useState<Holding[]>(seedHoldings);

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

  const summary = getPortfolioSummary(holdings);

  return (
    <PortfolioContext.Provider value={{ holdings, summary, addTrade }}>
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
