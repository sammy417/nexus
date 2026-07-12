import { Asset } from "./types";

// 모든 금액은 원화(KRW) 기준 더미 데이터입니다.
export const assets: Asset[] = [
  {
    id: "1",
    type: "STOCK",
    name: "삼성전자",
    ticker: "005930",
    quantity: 30,
    avgPrice: 68000,
    currentPrice: 74500,
  },
  {
    id: "2",
    type: "STOCK",
    name: "NAVER",
    ticker: "035420",
    quantity: 8,
    avgPrice: 215000,
    currentPrice: 198500,
  },
  {
    id: "3",
    type: "STOCK",
    name: "Apple Inc.",
    ticker: "AAPL",
    quantity: 15,
    avgPrice: 231000,
    currentPrice: 254800,
  },
  {
    id: "4",
    type: "STOCK",
    name: "NVIDIA Corp.",
    ticker: "NVDA",
    quantity: 6,
    avgPrice: 607000,
    currentPrice: 567000,
  },
  {
    id: "5",
    type: "STOCK",
    name: "카카오",
    ticker: "035720",
    quantity: 20,
    avgPrice: 52000,
    currentPrice: 47300,
  },
  {
    id: "6",
    type: "CASH",
    name: "입출금 통장",
    amount: 8500000,
  },
  {
    id: "7",
    type: "CASH",
    name: "정기예금",
    amount: 20000000,
  },
  {
    id: "8",
    type: "REAL_ESTATE",
    name: "자가 아파트",
    purchasePrice: 550000000,
    currentValue: 620000000,
  },
];
