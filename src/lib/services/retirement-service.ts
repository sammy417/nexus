import { RetirementInputs } from "@/lib/models/retirement";

/**
 * The 은퇴 projection. Two things make this trustworthy rather than a
 * feel-good number:
 *
 *  1. **Everything is computed in real (today's money) terms.** A nominal
 *     "2 billion won in 2050" hides that inflation has halved its purchasing
 *     power; showing today's-money figures keeps "is it enough?" honest. The
 *     nominal equivalents are carried alongside only for the trajectory chart,
 *     which has to connect continuously to the actual (nominal) history.
 *
 *  2. **The headline answer is an age, not a balance.** "당신의 돈은 88세까지
 *     버팁니다" is something a person can act on; "예상 자산 14.2억" is not.
 *
 * All amounts are KRW-base; the display layer converts to the chosen currency.
 */

const MONTHS_PER_YEAR = 12;
/** Simulation ceiling — a plan that outlasts this age is treated as sustainable. */
const MAX_AGE = 120;
/** Largest delay (years) the "retire later" prescription will search. */
const MAX_DELAY_YEARS = 40;

/** Nominal annual rate → real annual rate, given inflation. */
function realAnnualRate(nominalPct: number, inflationPct: number): number {
  return (1 + nominalPct / 100) / (1 + inflationPct / 100) - 1;
}

/** Annual rate → equivalent monthly rate. */
function toMonthlyRate(annualRate: number): number {
  return Math.pow(1 + annualRate, 1 / MONTHS_PER_YEAR) - 1;
}

const isZeroRate = (rm: number) => Math.abs(rm) < 1e-9;

/**
 * Future value of a starting balance plus a level monthly contribution
 * (paid at each month's end) after `months`, at monthly rate `rm`.
 */
function accumulate(current: number, monthlySaving: number, months: number, rm: number): number {
  if (months <= 0) return current;
  const growth = Math.pow(1 + rm, months);
  const fvSavings = isZeroRate(rm) ? monthlySaving * months : (monthlySaving * (growth - 1)) / rm;
  return current * growth + fvSavings;
}

/** Present value of `pmt` paid monthly for `months` (annuity-immediate) at `rm`. */
function annuityPresentValue(pmt: number, months: number, rm: number): number {
  if (months <= 0 || pmt <= 0) return 0;
  return isZeroRate(rm) ? pmt * months : (pmt * (1 - Math.pow(1 + rm, -months))) / rm;
}

/**
 * Age at which a starting balance is exhausted by a level monthly withdrawal,
 * or null if it lasts past MAX_AGE (or never falls — withdrawals covered by
 * growth). Simulated month by month so it's robust at any rate, including
 * negative real returns.
 */
function depletionAge(
  startBalance: number,
  netMonthlyWithdrawal: number,
  retirementAge: number,
  rm: number
): number | null {
  if (netMonthlyWithdrawal <= 0) return null;
  let balance = startBalance;
  const maxMonths = Math.round((MAX_AGE - retirementAge) * MONTHS_PER_YEAR);
  for (let m = 0; m < maxMonths; m++) {
    balance = balance * (1 + rm) - netMonthlyWithdrawal;
    if (balance <= 0) return retirementAge + (m + 1) / MONTHS_PER_YEAR;
  }
  return null;
}

export interface RetirementScenario {
  key: "CONSERVATIVE" | "BASE" | "OPTIMISTIC";
  label: string;
  nominalReturnPct: number;
  /** Assets at the retirement date, in today's money. */
  retirementAssetsRealKrw: number;
  /** …and the same amount in the future's nominal won. */
  retirementAssetsNominalKrw: number;
  depletionAge: number | null;
}

export interface ProjectionBandPoint {
  /** Calendar year of this point. */
  year: number;
  /** Age at this point. */
  age: number;
  /** Nominal projected assets under each scenario. */
  conservativeKrw: number;
  baseKrw: number;
  optimisticKrw: number;
}

export interface RetirementPrescription {
  onTrack: boolean;
  /** Extra monthly saving (today's money) that would close the gap under the base return. */
  extraMonthlySavingKrw: number;
  /** Whole years of delayed retirement that would close the gap (0 = not achievable within cap). */
  delayYears: number;
  /** Monthly expense reduction (today's money) that would close the gap. */
  reduceMonthlyExpenseKrw: number;
}

export interface RetirementProjection {
  currentAge: number;
  yearsToRetirement: number;
  yearsInRetirement: number;
  /** Monthly saving used (today's money) — detected or manual. */
  monthlySavingKrw: number;
  /** Net monthly withdrawal in retirement: expense − other income (≥ 0). */
  netMonthlyWithdrawalKrw: number;
  /** Assets needed at retirement to fund the plan, in today's money. */
  neededRealKrw: number;
  /** …and in the retirement year's nominal won (the chart's goal line). */
  neededNominalKrw: number;
  /** Base-return outcome (the headline). */
  base: RetirementScenario;
  /** Conservative / base / optimistic, for the band chart. */
  scenarios: RetirementScenario[];
  /** base assets ÷ needed (both real). Infinity when nothing needs funding. */
  achievementRatio: number;
  /** base assets − needed, today's money (negative = shortfall). */
  surplusRealKrw: number;
  /** Base-return depletion age (null = lasts past the plan). */
  depletionAge: number | null;
  prescription: RetirementPrescription;
  /** Nominal accumulation trajectory, now → retirement (yearly). */
  bandSeries: ProjectionBandPoint[];
}

/** The parts of the calculation that don't depend on the return assumption. */
interface Frame {
  currentAge: number;
  yearsToRetirement: number;
  monthsToRetirement: number;
  yearsInRetirement: number;
  monthsInRetirement: number;
  netMonthlyWithdrawalKrw: number;
  monthlySavingKrw: number;
  currentAssetsKrw: number;
  inflationPct: number;
}

function scenarioFor(
  key: RetirementScenario["key"],
  label: string,
  nominalReturnPct: number,
  frame: Frame
): RetirementScenario {
  const rm = toMonthlyRate(realAnnualRate(nominalReturnPct, frame.inflationPct));
  const real = accumulate(
    frame.currentAssetsKrw,
    frame.monthlySavingKrw,
    frame.monthsToRetirement,
    rm
  );
  const nominal = real * Math.pow(1 + frame.inflationPct / 100, frame.yearsToRetirement);
  return {
    key,
    label,
    nominalReturnPct,
    retirementAssetsRealKrw: real,
    retirementAssetsNominalKrw: nominal,
    depletionAge: depletionAge(
      real,
      frame.netMonthlyWithdrawalKrw,
      frame.currentAge + frame.yearsToRetirement,
      rm
    ),
  };
}

function buildBandSeries(frame: Frame, returns: { conservative: number; base: number; optimistic: number }): ProjectionBandPoint[] {
  const thisYear = new Date().getUTCFullYear();
  const rmC = toMonthlyRate(realAnnualRate(returns.conservative, frame.inflationPct));
  const rmB = toMonthlyRate(realAnnualRate(returns.base, frame.inflationPct));
  const rmO = toMonthlyRate(realAnnualRate(returns.optimistic, frame.inflationPct));
  const inflationFactor = (year: number) => Math.pow(1 + frame.inflationPct / 100, year);

  const points: ProjectionBandPoint[] = [];
  for (let year = 0; year <= frame.yearsToRetirement; year++) {
    const months = year * MONTHS_PER_YEAR;
    const toNominal = inflationFactor(year);
    points.push({
      year: thisYear + year,
      age: frame.currentAge + year,
      conservativeKrw:
        accumulate(frame.currentAssetsKrw, frame.monthlySavingKrw, months, rmC) * toNominal,
      baseKrw: accumulate(frame.currentAssetsKrw, frame.monthlySavingKrw, months, rmB) * toNominal,
      optimisticKrw:
        accumulate(frame.currentAssetsKrw, frame.monthlySavingKrw, months, rmO) * toNominal,
    });
  }
  return points;
}

function prescribe(frame: Frame, baseReturnPct: number, neededRealKrw: number, baseAssetsRealKrw: number): RetirementPrescription {
  const shortfall = neededRealKrw - baseAssetsRealKrw;
  if (shortfall <= 0) {
    return { onTrack: true, extraMonthlySavingKrw: 0, delayYears: 0, reduceMonthlyExpenseKrw: 0 };
  }

  const rm = toMonthlyRate(realAnnualRate(baseReturnPct, frame.inflationPct));

  // Lever 1 — save more: extra monthly contribution whose future value covers the shortfall.
  const savingsFactor = isZeroRate(rm)
    ? frame.monthsToRetirement
    : (Math.pow(1 + rm, frame.monthsToRetirement) - 1) / rm;
  const extraMonthlySavingKrw = savingsFactor > 0 ? shortfall / savingsFactor : 0;

  // Lever 2 — retire later: each extra year adds accumulation and removes a year of funding.
  let delayYears = 0;
  for (let d = 1; d <= MAX_DELAY_YEARS; d++) {
    const monthsToRetire = frame.monthsToRetirement + d * MONTHS_PER_YEAR;
    const monthsInRetire = frame.monthsInRetirement - d * MONTHS_PER_YEAR;
    if (monthsInRetire <= 0) break; // retiring this late leaves nothing to fund
    const assets = accumulate(frame.currentAssetsKrw, frame.monthlySavingKrw, monthsToRetire, rm);
    const needed = annuityPresentValue(frame.netMonthlyWithdrawalKrw, monthsInRetire, rm);
    if (assets >= needed) {
      delayYears = d;
      break;
    }
  }

  // Lever 3 — spend less: the withdrawal the current assets can actually sustain.
  const pvFactor = annuityPresentValue(1, frame.monthsInRetirement, rm);
  const sustainableWithdrawal = pvFactor > 0 ? baseAssetsRealKrw / pvFactor : 0;
  const reduceMonthlyExpenseKrw = Math.max(
    0,
    Math.min(frame.netMonthlyWithdrawalKrw - sustainableWithdrawal, frame.netMonthlyWithdrawalKrw)
  );

  return { onTrack: false, extraMonthlySavingKrw, delayYears, reduceMonthlyExpenseKrw };
}

/**
 * Run the full projection. `currentAssetsKrw` is the scope's current
 * valuation (KRW base) and `monthlySavingKrw` is the saving pace to assume
 * (detected or manual) — both supplied by the caller so this stays pure.
 */
export function projectRetirement(
  inputs: RetirementInputs,
  currentAssetsKrw: number,
  monthlySavingKrw: number
): RetirementProjection {
  const thisYear = new Date().getUTCFullYear();
  const currentAge = Math.max(0, thisYear - inputs.birthYear);
  // Someone already past their target age retires now.
  const yearsToRetirement = Math.max(0, inputs.retirementAge - currentAge);
  const effectiveRetirementAge = currentAge + yearsToRetirement;
  const yearsInRetirement = Math.max(0, inputs.lifeExpectancy - effectiveRetirementAge);

  const netMonthlyWithdrawalKrw = Math.max(
    0,
    inputs.monthlyExpenseKrw - inputs.otherMonthlyIncomeKrw
  );

  const frame: Frame = {
    currentAge,
    yearsToRetirement,
    monthsToRetirement: yearsToRetirement * MONTHS_PER_YEAR,
    yearsInRetirement,
    monthsInRetirement: yearsInRetirement * MONTHS_PER_YEAR,
    netMonthlyWithdrawalKrw,
    monthlySavingKrw: Math.max(0, monthlySavingKrw),
    currentAssetsKrw: Math.max(0, currentAssetsKrw),
    inflationPct: inputs.inflationPct,
  };

  const baseRm = toMonthlyRate(realAnnualRate(inputs.expectedReturnPct, inputs.inflationPct));
  const neededRealKrw = annuityPresentValue(
    netMonthlyWithdrawalKrw,
    frame.monthsInRetirement,
    baseRm
  );
  const neededNominalKrw =
    neededRealKrw * Math.pow(1 + inputs.inflationPct / 100, yearsToRetirement);

  const returns = {
    conservative: inputs.expectedReturnPct - 2,
    base: inputs.expectedReturnPct,
    optimistic: inputs.expectedReturnPct + 2,
  };
  const base = scenarioFor("BASE", "기본", returns.base, frame);
  const scenarios = [
    scenarioFor("CONSERVATIVE", "보수적", returns.conservative, frame),
    base,
    scenarioFor("OPTIMISTIC", "낙관적", returns.optimistic, frame),
  ];

  const surplusRealKrw = base.retirementAssetsRealKrw - neededRealKrw;
  const achievementRatio =
    neededRealKrw <= 0 ? Infinity : base.retirementAssetsRealKrw / neededRealKrw;

  return {
    currentAge,
    yearsToRetirement,
    yearsInRetirement,
    monthlySavingKrw: frame.monthlySavingKrw,
    netMonthlyWithdrawalKrw,
    neededRealKrw,
    neededNominalKrw,
    base,
    scenarios,
    achievementRatio,
    surplusRealKrw,
    depletionAge: base.depletionAge,
    prescription: prescribe(frame, returns.base, neededRealKrw, base.retirementAssetsRealKrw),
    bandSeries: buildBandSeries(frame, returns),
  };
}

// ---------------------------------------------------------------------------
// Savings-pace detection — so the form can suggest a monthly saving instead of
// asking the user to guess.
// ---------------------------------------------------------------------------

export interface SavingsPace {
  /** Median monthly change in invested principal (KRW). */
  monthlyMedianKrw: number;
  /** Number of month-over-month changes the median is based on. */
  samples: number;
  /**
   * The principal series is lumpy — a big one-off jump (a late-registered
   * asset, a corrected average price) sits among the changes, so the median
   * is a rough guide rather than a measured cash flow.
   */
  noisy: boolean;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/**
 * Estimate the monthly saving pace from the principal history. Principal
 * rises when money is added, so its month-over-month change approximates
 * net contributions — but it also jumps when an old asset is finally entered
 * or a price is corrected, so the **median** (not the mean) is used and
 * lumpiness is flagged rather than hidden.
 */
export function detectSavingsPace(
  points: readonly { date: string; totalPrincipal: number }[],
  maxMonths = 12
): SavingsPace | null {
  // Last principal reading of each month.
  const lastPerMonth = new Map<string, number>();
  for (const point of points) lastPerMonth.set(point.date.slice(0, 7), point.totalPrincipal);
  const months = [...lastPerMonth.keys()].sort();
  if (months.length < 2) return null;

  const deltas: number[] = [];
  for (let i = 1; i < months.length; i++) {
    deltas.push(lastPerMonth.get(months[i])! - lastPerMonth.get(months[i - 1])!);
  }
  const recent = deltas.slice(-maxMonths);
  const monthlyMedianKrw = median(recent);

  const maxAbsDelta = Math.max(...recent.map(Math.abs));
  const noisy = monthlyMedianKrw !== 0 && maxAbsDelta > 3 * Math.abs(monthlyMedianKrw);

  return { monthlyMedianKrw, samples: recent.length, noisy };
}
