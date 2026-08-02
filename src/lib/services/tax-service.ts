import { Asset, StockAsset } from "@/lib/models/asset";
import { DividendRecord } from "@/lib/models/dividend";
import {
  FINANCIAL_INCOME_THRESHOLD_KRW,
  FOREIGN_CGT_EXEMPTION_KRW,
  FOREIGN_CGT_RATE,
  PENSION_COMBINED_CREDIT_LIMIT_KRW,
  PENSION_CREDIT_RATE_HIGH_INCOME,
  PENSION_CREDIT_RATE_LOW_INCOME,
  PENSION_SAVINGS_CREDIT_LIMIT_KRW,
} from "@/lib/models/tax";
import { getStockHoldings, isStock } from "./stock-analysis-service";
import { dividendToKrw } from "./dividend-service";

/**
 * Three lightweight tax simulators, all computed client-side from data the
 * app already has (current holdings, dividend records). None of this is
 * personalized tax advice — every figure is a clearly-labeled estimate
 * against the current headline rules.
 */

// ---------------------------------------------------------------------------
// 1) 해외주식 양도소득세 시뮬레이터 — "지금 매도한다면" 기준의 가상 손익.
//    실제 과세는 실현손익(매도 시점) 기준이라, 보유 중인 평가손익으로 하는
//    시뮬레이션일 뿐 확정 세액이 아니다.
// ---------------------------------------------------------------------------

export interface ForeignStockLot {
  asset: StockAsset;
  /** Unrealized P&L if sold today, KRW. */
  profitKrw: number;
  valuationKrw: number;
}

/** Foreign-listed stock holdings with their unrealized P&L (KRW). */
export function getForeignStockLots(assets: Asset[], usdKrw: number): ForeignStockLot[] {
  return getStockHoldings(assets.filter(isStock), usdKrw)
    .filter((h) => h.region === "FOREIGN")
    .map((h) => ({ asset: h.asset, profitKrw: h.profit, valuationKrw: h.valuation }));
}

export interface CapitalGainsSummary {
  /** Sum of selected lots' unrealized P&L, KRW (can be negative). */
  netGainKrw: number;
  /** Portion of the annual exemption already "used" by this year's realized gains (0 here — see note below). */
  exemptionUsedKrw: number;
  /** Exemption still available this year. */
  exemptionRemainingKrw: number;
  /** Gain left after the exemption, taxed at FOREIGN_CGT_RATE. */
  taxableGainKrw: number;
  estimatedTaxKrw: number;
}

/**
 * Tax owed if the selected lots were sold today, given `realizedThisYearKrw`
 * of gains already realized this calendar year (0 if the user hasn't sold
 * anything yet — the exemption is annual and doesn't carry over unused).
 */
export function getCapitalGainsSummary(
  selectedProfitsKrw: number[],
  realizedThisYearKrw = 0
): CapitalGainsSummary {
  const netGainKrw = selectedProfitsKrw.reduce((sum, p) => sum + p, 0);
  const exemptionUsedKrw = Math.min(
    FOREIGN_CGT_EXEMPTION_KRW,
    Math.max(0, realizedThisYearKrw)
  );
  const exemptionRemainingKrw = Math.max(0, FOREIGN_CGT_EXEMPTION_KRW - exemptionUsedKrw);
  const taxableGainKrw = Math.max(0, netGainKrw - exemptionRemainingKrw);
  return {
    netGainKrw,
    exemptionUsedKrw,
    exemptionRemainingKrw,
    taxableGainKrw,
    estimatedTaxKrw: taxableGainKrw * FOREIGN_CGT_RATE,
  };
}

// ---------------------------------------------------------------------------
// 2) 금융소득종합과세 트래커 — 올해 배당·이자(원천징수 대상) 합계 vs 기준금액.
// ---------------------------------------------------------------------------

export interface FinancialIncomeSummary {
  thisYearIncomeKrw: number;
  thresholdKrw: number;
  /** Portion of the threshold used, percent (can exceed 100). */
  ratio: number;
  overThreshold: boolean;
  excessKrw: number;
}

export function getFinancialIncomeSummary(
  records: DividendRecord[],
  usdKrw: number
): FinancialIncomeSummary {
  const thisYear = String(new Date().getUTCFullYear());
  const thisYearIncomeKrw = records
    .filter((r) => r.date.startsWith(thisYear))
    .reduce((sum, r) => sum + dividendToKrw(r, usdKrw), 0);
  const overThreshold = thisYearIncomeKrw > FINANCIAL_INCOME_THRESHOLD_KRW;
  return {
    thisYearIncomeKrw,
    thresholdKrw: FINANCIAL_INCOME_THRESHOLD_KRW,
    ratio: (thisYearIncomeKrw / FINANCIAL_INCOME_THRESHOLD_KRW) * 100,
    overThreshold,
    excessKrw: overThreshold ? thisYearIncomeKrw - FINANCIAL_INCOME_THRESHOLD_KRW : 0,
  };
}

// ---------------------------------------------------------------------------
// 3) 연금 세액공제 계산기 — 연금저축·IRP 올해 납입액을 입력받는 계산기
//    (누적 납입원금만 저장되는 현재 데이터 모델로는 "올해 납입액"을 도출할
//    수 없어 사용자가 직접 입력한다).
// ---------------------------------------------------------------------------

export interface PensionCreditResult {
  /** Contribution counted toward the 연금저축 solo limit. */
  eligibleSavingsKrw: number;
  /** Combined eligible contribution (연금저축 + IRP), capped at the combined limit. */
  eligibleCombinedKrw: number;
  creditRate: number;
  estimatedCreditKrw: number;
  /** Additional combined contribution that would still earn credit this year. */
  remainingRoomKrw: number;
}

export function getPensionCredit(
  pensionSavingsKrw: number,
  irpKrw: number,
  isLowIncome: boolean
): PensionCreditResult {
  const savings = Math.max(0, pensionSavingsKrw);
  const irp = Math.max(0, irpKrw);
  const eligibleSavingsKrw = Math.min(savings, PENSION_SAVINGS_CREDIT_LIMIT_KRW);
  const eligibleCombinedKrw = Math.min(
    eligibleSavingsKrw + irp,
    PENSION_COMBINED_CREDIT_LIMIT_KRW
  );
  const creditRate = isLowIncome ? PENSION_CREDIT_RATE_LOW_INCOME : PENSION_CREDIT_RATE_HIGH_INCOME;
  return {
    eligibleSavingsKrw,
    eligibleCombinedKrw,
    creditRate,
    estimatedCreditKrw: eligibleCombinedKrw * creditRate,
    remainingRoomKrw: Math.max(0, PENSION_COMBINED_CREDIT_LIMIT_KRW - eligibleCombinedKrw),
  };
}
