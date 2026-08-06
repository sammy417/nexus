/**
 * Korean individual tax constants used by the 세금 (tax) simulators. These
 * are the current headline rules — not personalized advice, and everything
 * derived from them is clearly labeled as an estimate. Rates already
 * include local income tax (지방소득세) unless noted.
 */

/** 해외주식 양도소득세: 국내 거주자가 해외 상장주식을 매도해 얻은 차익에 적용. */
export const FOREIGN_CGT_RATE = 0.22; // 20% national + 2% local
/** 연간 기본공제 — 해당 연도 순차익에서 공제, 다음 해로 이월되지 않음(미사용분 소멸). */
export const FOREIGN_CGT_EXEMPTION_KRW = 2_500_000;

/**
 * 금융소득종합과세 기준금액 — 이자·배당 합산이 이를 넘으면 초과분이 종합
 * 과세 대상. 기준금액 이하일 때 적용되는 원천징수 세율은 `DIVIDEND_TAX_RATE`
 * (dividend.ts, 15.4%) — 같은 세율이라 여기서 다시 정의하지 않는다.
 */
export const FINANCIAL_INCOME_THRESHOLD_KRW = 20_000_000;

/** 연금저축 단독 세액공제 인정 한도(연간 납입액 기준). */
export const PENSION_SAVINGS_CREDIT_LIMIT_KRW = 6_000_000;
/** 연금저축 + IRP 합산 세액공제 인정 한도. */
export const PENSION_COMBINED_CREDIT_LIMIT_KRW = 9_000_000;
/** 총급여 5,500만원(종합소득금액 4,500만원) 이하일 때 공제율(13.2%+3.3%p 지방세 포함 16.5%). */
export const PENSION_CREDIT_RATE_LOW_INCOME = 0.165;
/** 그 외 구간 공제율(12%+지방세 포함 13.2%). */
export const PENSION_CREDIT_RATE_HIGH_INCOME = 0.132;

/**
 * 사적연금(연금저축·IRP) 수령 시 연금소득세 — 세액공제를 받은 납입액과
 * 운용수익에 과세되며, 수령 연령이 높을수록 세율이 낮다(지방소득세 포함).
 */
export const PENSION_WITHDRAWAL_RATE_UNDER_70 = 0.055; // 55~69세: 5% + 지방세
export const PENSION_WITHDRAWAL_RATE_70S = 0.044; // 70~79세: 4% + 지방세
export const PENSION_WITHDRAWAL_RATE_80_PLUS = 0.033; // 80세~: 3% + 지방세

/**
 * 사적연금 저율·분리과세 한도 — 연간 사적연금 수령액이 이를 넘으면 그 해
 * 연금소득 전체가 종합과세 또는 16.5% 분리과세(선택) 대상이 된다. 수령
 * 기간을 늘려 연 수령액을 이 아래로 유지하는 것이 대표적인 절세 전략이다.
 */
export const PENSION_SEPARATE_TAX_THRESHOLD_KRW = 15_000_000;
/** 한도 초과 시 선택할 수 있는 분리과세 세율(지방소득세 포함). */
export const PENSION_ELECTIVE_SEPARATE_RATE = 0.165;

/** 수령 연령에 해당하는 연금소득세율(저율·분리과세 구간). */
export function pensionWithdrawalRate(age: number): number {
  if (age >= 80) return PENSION_WITHDRAWAL_RATE_80_PLUS;
  if (age >= 70) return PENSION_WITHDRAWAL_RATE_70S;
  return PENSION_WITHDRAWAL_RATE_UNDER_70;
}
