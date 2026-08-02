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
