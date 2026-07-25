import { DividendInput } from "./dividend";

function monthsAgo(months: number, day: number): string {
  const date = new Date();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() - months);
  date.setUTCDate(day);
  // Never emit a future date (e.g. asking for day 17 on the 5th of the month).
  if (date.getTime() > Date.now()) {
    date.setUTCMonth(date.getUTCMonth() - 1);
  }
  return date.toISOString().slice(0, 10);
}

/** Demo payout history relative to today, so the chart always has recent bars. */
export function getSeedDividends(): DividendInput[] {
  return [
    { name: "삼성전자", amount: 10830, owner: "SELF", date: monthsAgo(3, 17), memo: "분기 배당" },
    { name: "Apple Inc.", amount: 3.75, currency: "USD", owner: "SELF", date: monthsAgo(2, 15), memo: "분기 배당" },
    { name: "국고채 3년 (KTB)", amount: 159250, owner: "SELF", date: monthsAgo(1, 10), memo: "이표 이자" },
    { name: "삼성전자", amount: 10830, owner: "SELF", date: monthsAgo(0, 17), memo: "분기 배당" },
  ];
}
