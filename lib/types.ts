export interface Holding {
  id: string;
  name: string;
  ticker: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
}

export type TradeType = "BUY" | "SELL";

export interface Trade {
  id: string;
  stockName: string;
  type: TradeType;
  price: number;
  quantity: number;
  tradedAt: string;
}
