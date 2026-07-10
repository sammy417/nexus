import { Holding } from "./types";

// 모든 금액은 원화(KRW) 기준 더미 데이터입니다.
export const holdings: Holding[] = [
  {
    id: "1",
    name: "삼성전자",
    ticker: "005930",
    quantity: 30,
    avgPrice: 68000,
    currentPrice: 74500,
  },
  {
    id: "2",
    name: "NAVER",
    ticker: "035420",
    quantity: 8,
    avgPrice: 215000,
    currentPrice: 198500,
  },
  {
    id: "3",
    name: "Apple Inc.",
    ticker: "AAPL",
    quantity: 15,
    avgPrice: 231000,
    currentPrice: 254800,
  },
  {
    id: "4",
    name: "NVIDIA Corp.",
    ticker: "NVDA",
    quantity: 6,
    avgPrice: 607000,
    currentPrice: 567000,
  },
  {
    id: "5",
    name: "카카오",
    ticker: "035720",
    quantity: 20,
    avgPrice: 52000,
    currentPrice: 47300,
  },
];
