import { Holding } from "./types";

export interface HoldingMetrics {
  principal: number;
  valuation: number;
  profit: number;
  profitRate: number;
}

export function getHoldingMetrics(holding: Holding): HoldingMetrics {
  const principal = holding.avgPrice * holding.quantity;
  const valuation = holding.currentPrice * holding.quantity;
  const profit = valuation - principal;
  const profitRate = principal === 0 ? 0 : (profit / principal) * 100;
  return { principal, valuation, profit, profitRate };
}

export interface PortfolioSummary {
  totalPrincipal: number;
  totalValuation: number;
  totalProfit: number;
  totalProfitRate: number;
}

export function getPortfolioSummary(holdings: Holding[]): PortfolioSummary {
  const totals = holdings.reduce(
    (acc, holding) => {
      const { principal, valuation } = getHoldingMetrics(holding);
      acc.totalPrincipal += principal;
      acc.totalValuation += valuation;
      return acc;
    },
    { totalPrincipal: 0, totalValuation: 0 }
  );

  const totalProfit = totals.totalValuation - totals.totalPrincipal;
  const totalProfitRate =
    totals.totalPrincipal === 0 ? 0 : (totalProfit / totals.totalPrincipal) * 100;

  return {
    totalPrincipal: totals.totalPrincipal,
    totalValuation: totals.totalValuation,
    totalProfit,
    totalProfitRate,
  };
}
