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
// type-only: the service module itself is server-only
import type { HoldingDividendForecast } from "./dividend-forecast-service";

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
  /** Gains/losses already realized this calendar year (user input, can be negative). */
  realizedSoFarKrw: number;
  /** Hypothetical additional gain from also selling the selected lots today. */
  additionalGainKrw: number;
  /** realizedSoFarKrw + additionalGainKrw — the year's total if the selected lots are sold too. */
  totalGainKrw: number;
  /** totalGainKrw after the annual exemption, taxed at FOREIGN_CGT_RATE. */
  taxableGainKrw: number;
  /** Tax on totalGainKrw. */
  estimatedTaxKrw: number;
  /** Tax already owed from realizedSoFarKrw alone, before selling anything else. */
  taxOnRealizedOnlyKrw: number;
  /** estimatedTaxKrw − taxOnRealizedOnlyKrw: the marginal tax caused by selling the selected lots. */
  additionalTaxKrw: number;
  /** Exemption still unused given only what's been realized so far (before any new sale). */
  exemptionRemainingKrw: number;
}

function taxOnGain(gainKrw: number): number {
  return Math.max(0, gainKrw - FOREIGN_CGT_EXEMPTION_KRW) * FOREIGN_CGT_RATE;
}

/**
 * Tax on the year's total realized gain — what's already been realized this
 * calendar year (`realizedSoFarKrw`, entered by the user; can be negative)
 * plus the hypothetical gain from also selling the currently-selected lots
 * today. The 250만원 exemption applies once, to the combined total, not
 * separately to each part — a prior loss genuinely offsets a later gain,
 * and a prior gain already consumes exemption before any new sale.
 */
export function getCapitalGainsSummary(
  realizedSoFarKrw: number,
  additionalProfitsKrw: number[]
): CapitalGainsSummary {
  const additionalGainKrw = additionalProfitsKrw.reduce((sum, p) => sum + p, 0);
  const totalGainKrw = realizedSoFarKrw + additionalGainKrw;
  const taxOnRealizedOnlyKrw = taxOnGain(realizedSoFarKrw);
  const estimatedTaxKrw = taxOnGain(totalGainKrw);
  return {
    realizedSoFarKrw,
    additionalGainKrw,
    totalGainKrw,
    taxableGainKrw: Math.max(0, totalGainKrw - FOREIGN_CGT_EXEMPTION_KRW),
    estimatedTaxKrw,
    taxOnRealizedOnlyKrw,
    additionalTaxKrw: estimatedTaxKrw - taxOnRealizedOnlyKrw,
    exemptionRemainingKrw: Math.max(
      0,
      FOREIGN_CGT_EXEMPTION_KRW - Math.max(0, realizedSoFarKrw)
    ),
  };
}

// ---------------------------------------------------------------------------
// 2) 금융소득종합과세 트래커 — 올해 배당·이자(원천징수 대상) 합계 vs 기준금액.
//    배당 메뉴에 기록된 금액에 (a) 앱에 기록하지 않은 배당·이자를 보정하는
//    수동 입력, (b) 연말까지 예상되는 추가 배당(배당률·보유 수량이 그대로
//    유지된다는 가정의 프로젝션)을 더해 "지금까지"와 "연말 예상" 두 시점을
//    함께 보여준다.
// ---------------------------------------------------------------------------

export interface FinancialIncomeSummary {
  /** Sum of dividend-menu records dated this year. */
  recordedThisYearKrw: number;
  /** User-entered top-up for dividends/interest not logged in the app. */
  manualAdjustmentKrw: number;
  /** recordedThisYearKrw + manualAdjustmentKrw — everything known as of today. */
  currentIncomeKrw: number;
  /** Additional dividends the forecast projects between now and Dec 31. */
  projectedRemainingKrw: number;
  /** currentIncomeKrw + projectedRemainingKrw, assuming no rate change or new purchases. */
  projectedYearEndKrw: number;
  thresholdKrw: number;
  currentOverThreshold: boolean;
  currentExcessKrw: number;
  projectedOverThreshold: boolean;
  projectedExcessKrw: number;
}

export function getFinancialIncomeSummary(
  records: DividendRecord[],
  usdKrw: number,
  manualAdjustmentKrw = 0,
  projectedRemainingKrw = 0
): FinancialIncomeSummary {
  const thisYear = String(new Date().getUTCFullYear());
  const recordedThisYearKrw = records
    .filter((r) => r.date.startsWith(thisYear))
    .reduce((sum, r) => sum + dividendToKrw(r, usdKrw), 0);
  const adjustment = Math.max(0, manualAdjustmentKrw);
  const remaining = Math.max(0, projectedRemainingKrw);
  const currentIncomeKrw = recordedThisYearKrw + adjustment;
  const projectedYearEndKrw = currentIncomeKrw + remaining;
  const currentOverThreshold = currentIncomeKrw > FINANCIAL_INCOME_THRESHOLD_KRW;
  const projectedOverThreshold = projectedYearEndKrw > FINANCIAL_INCOME_THRESHOLD_KRW;
  return {
    recordedThisYearKrw,
    manualAdjustmentKrw: adjustment,
    currentIncomeKrw,
    projectedRemainingKrw: remaining,
    projectedYearEndKrw,
    thresholdKrw: FINANCIAL_INCOME_THRESHOLD_KRW,
    currentOverThreshold,
    currentExcessKrw: currentOverThreshold ? currentIncomeKrw - FINANCIAL_INCOME_THRESHOLD_KRW : 0,
    projectedOverThreshold,
    projectedExcessKrw: projectedOverThreshold
      ? projectedYearEndKrw - FINANCIAL_INCOME_THRESHOLD_KRW
      : 0,
  };
}

/**
 * 연말까지 추가로 받을 것으로 예상되는 배당 총합 — 배당률이 바뀌거나 신규
 * 종목을 취득하는 경우는 제외하고, 현재 예측된 지급 주기·금액이 그대로
 * 유지된다고 가정한다. 각 보유 종목의 다음 지급 예정일부터 추정 주기
 * 간격으로 연말까지 몇 번 더 지급되는지 세어, 마지막 지급액(주당 최근
 * 배당 × 현재 수량)이 매번 반복된다고 본다.
 */
export function getYearEndDividendProjection(holdings: HoldingDividendForecast[]): number {
  const yearEnd = Date.UTC(new Date().getUTCFullYear(), 11, 31);
  let total = 0;
  for (const holding of holdings) {
    if (!holding.nextExDateEstimate || holding.nextAmountKrw === null || holding.frequencyPerYear <= 0) {
      continue;
    }
    const intervalDays = Math.max(1, Math.round(365 / holding.frequencyPerYear));
    let cursor = Date.parse(holding.nextExDateEstimate);
    // Cap iterations generously — a monthly payer maxes out at 12 hits/year.
    for (let i = 0; i < 12 && cursor <= yearEnd; i++) {
      total += holding.nextAmountKrw;
      cursor += intervalDays * 86400000;
    }
  }
  return total;
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
