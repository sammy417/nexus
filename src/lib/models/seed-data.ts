import { AssetInput } from "./asset";

/**
 * Initial demo data (KRW). Used to seed a fresh SQLite database on first
 * run and as the default dataset for the in-memory mock repository.
 */
export const SEED_ASSETS: AssetInput[] = [
  {
    type: "STOCK",
    name: "삼성전자",
    market: "KRX",
    ticker: "005930",
    quantity: 30,
    avgPrice: 68000,
    currentPrice: 74500,
  },
  {
    type: "STOCK",
    name: "NAVER",
    market: "KRX",
    ticker: "035420",
    quantity: 8,
    avgPrice: 215000,
    currentPrice: 198500,
  },
  {
    type: "STOCK",
    name: "Apple Inc.",
    market: "NASDAQ",
    ticker: "AAPL",
    quantity: 15,
    avgPrice: 231000,
    currentPrice: 254800,
  },
  {
    type: "STOCK",
    name: "NVIDIA Corp.",
    market: "NASDAQ",
    ticker: "NVDA",
    quantity: 6,
    avgPrice: 607000,
    currentPrice: 567000,
  },
  {
    type: "STOCK",
    name: "카카오",
    market: "KRX",
    ticker: "035720",
    quantity: 20,
    avgPrice: 52000,
    currentPrice: 47300,
  },
  {
    type: "CASH",
    name: "입출금 통장",
    balance: 8500000,
  },
  {
    type: "CASH",
    name: "정기예금",
    balance: 20000000,
  },
];
