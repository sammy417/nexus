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
    currency: "USD",
    quantity: 15,
    avgPrice: 165,
    currentPrice: 182,
  },
  {
    type: "STOCK",
    name: "NVIDIA Corp.",
    market: "NASDAQ",
    ticker: "NVDA",
    currency: "USD",
    quantity: 6,
    avgPrice: 433,
    currentPrice: 405,
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
    type: "BOND",
    name: "국고채 3년 (KTB)",
    purchasePrice: 9800000,
    currentValue: 9930000,
    couponRate: 3.25,
    maturityDate: "2029-03-10",
  },
  {
    type: "BOND",
    name: "회사채 AA- (한전)",
    purchasePrice: 5000000,
    currentValue: 4915000,
    couponRate: 4.1,
    maturityDate: "2027-11-24",
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
  {
    type: "CUSTOM",
    name: "금 현물 (KRX 금시장)",
    category: "금",
    purchasePrice: 3000000,
    currentValue: 3450000,
  },
];
