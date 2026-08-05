import { Asset, AssetInput, AssetOwner, AssetType, Currency } from "./asset";

/**
 * The add/edit form's raw state, and the rules that turn it into a stored
 * `AssetInput`.
 *
 * Kept out of the component because this is where the *stored* shape is
 * decided — which price becomes 현재가, whether a typed sector wins over the
 * looked-up one, whether a sub-sector survives — and those rules are worth
 * testing directly rather than through the DOM. The one thing this file
 * can't do is talk to the network: the caller performs the quote lookup and
 * hands the outcome in.
 *
 * Every field is a string (as typed), including numbers, so the inputs stay
 * controlled and partially-typed values like "" or "12." don't get coerced
 * behind the user's back.
 */

export interface AssetFormValues {
  type: AssetType;
  currency: Currency;
  owner: AssetOwner;
  name: string;
  /** CUSTOM */
  category: string;
  isHome: boolean;
  /** PENSION */
  accountType: string;
  /** STOCK */
  market: string;
  ticker: string;
  sector: string;
  subSector: string;
  quantity: string;
  avgPrice: string;
  /** CASH */
  balance: string;
  /** BOND · CUSTOM · PENSION (납입 원금) */
  purchasePrice: string;
  currentValue: string;
  /** BOND */
  couponRate: string;
  maturityDate: string;
}

/** How the ticker lookup went — the form can still be saved when it fails. */
export type QuoteOutcome =
  | { status: "NONE" }
  | { status: "OK"; price: number; sector?: string }
  | { status: "FAILED" };

export type BuildResult =
  | { ok: true; input: AssetInput; warning?: string }
  | { ok: false; error: string };

/**
 * Form state for a fresh entry, or pre-filled from the asset being edited.
 * Type-specific fields stay empty unless the asset actually has them, so
 * switching type never carries a stale value into the saved record.
 */
export function initialFormValues(editingAsset: Asset | null): AssetFormValues {
  const stock = editingAsset?.type === "STOCK" ? editingAsset : null;
  const bond = editingAsset?.type === "BOND" ? editingAsset : null;
  const custom = editingAsset?.type === "CUSTOM" ? editingAsset : null;
  const pension = editingAsset?.type === "PENSION" ? editingAsset : null;
  const cash = editingAsset?.type === "CASH" ? editingAsset : null;

  const purchasePrice = bond?.purchasePrice ?? custom?.purchasePrice ?? pension?.principalPaid;
  const currentValue = bond?.currentValue ?? custom?.currentValue ?? pension?.currentValue;

  return {
    type: editingAsset?.type ?? "STOCK",
    currency: editingAsset?.currency ?? "KRW",
    // Editing keeps the stored owner (undefined = 공동); new entries default to 본인.
    owner: editingAsset ? editingAsset.owner ?? "JOINT" : "SELF",
    name: editingAsset?.name ?? "",
    category: custom?.category ?? "",
    isHome: custom?.isHome ?? false,
    accountType: pension?.accountType ?? "",
    market: stock?.market ?? "",
    ticker: stock?.ticker ?? "",
    sector: stock?.sector ?? "",
    subSector: stock?.subSector ?? "",
    quantity: stock ? String(stock.quantity) : "",
    avgPrice: stock ? String(stock.avgPrice) : "",
    balance: cash ? String(cash.balance) : "",
    purchasePrice: purchasePrice !== undefined ? String(purchasePrice) : "",
    currentValue: currentValue !== undefined ? String(currentValue) : "",
    couponRate: bond?.couponRate !== undefined ? String(bond.couponRate) : "",
    maturityDate: bond?.maturityDate ?? "",
  };
}

/** Positive number from a text field; undefined when empty, null when invalid. */
export function parseOptionalPositive(raw: string): number | undefined | null {
  const trimmed = raw.trim();
  if (trimmed === "") return undefined;
  const value = Number(trimmed);
  return Number.isFinite(value) && value > 0 ? value : null;
}

/** True when this type needs a live quote before it can be saved. */
export function needsQuoteLookup(values: AssetFormValues): boolean {
  return values.type === "STOCK" && values.ticker.trim() !== "";
}

/**
 * Validate and assemble the stored record. Error and warning strings are
 * Korean source strings (i18n keys) for the caller to translate.
 */
export function buildAssetInput(
  values: AssetFormValues,
  editingAsset: Asset | null,
  quote: QuoteOutcome
): BuildResult {
  const name = values.name.trim();
  if (!name) return { ok: false, error: "이름을 입력해 주세요." };

  const { currency, owner } = values;
  const base = { name, currency, owner };

  switch (values.type) {
    case "STOCK":
      return buildStock(values, editingAsset, quote, base);

    case "BOND": {
      const amounts = parseAmountPair(values, "매입 금액을 올바르게 입력해 주세요.");
      if ("error" in amounts) return { ok: false, error: amounts.error };
      const rate = values.couponRate.trim() === "" ? undefined : Number(values.couponRate);
      if (rate !== undefined && (Number.isNaN(rate) || rate < 0)) {
        return { ok: false, error: "표면금리를 올바르게 입력해 주세요." };
      }
      return {
        ok: true,
        input: {
          ...base,
          type: "BOND",
          purchasePrice: amounts.principal,
          currentValue: amounts.current,
          couponRate: rate,
          maturityDate: values.maturityDate || undefined,
        },
      };
    }

    case "PENSION": {
      const amounts = parseAmountPair(values, "납입 원금을 올바르게 입력해 주세요.");
      if ("error" in amounts) return { ok: false, error: amounts.error };
      return {
        ok: true,
        input: {
          ...base,
          type: "PENSION",
          accountType: values.accountType.trim() || undefined,
          principalPaid: amounts.principal,
          currentValue: amounts.current,
        },
      };
    }

    case "CUSTOM": {
      const amounts = parseAmountPair(values, "매입 금액을 올바르게 입력해 주세요.");
      if ("error" in amounts) return { ok: false, error: amounts.error };
      return {
        ok: true,
        input: {
          ...base,
          type: "CUSTOM",
          category: values.category.trim() || undefined,
          purchasePrice: amounts.principal,
          currentValue: amounts.current,
          isHome: values.isHome || undefined,
        },
      };
    }

    case "CASH": {
      const amount = parseOptionalPositive(values.balance);
      if (amount === undefined || amount === null) {
        return { ok: false, error: "금액을 올바르게 입력해 주세요." };
      }
      return { ok: true, input: { ...base, type: "CASH", balance: amount } };
    }
  }
}

/**
 * The 매입 금액 / 현재 평가 금액 pair shared by BOND, PENSION and CUSTOM:
 * the principal is required, and an omitted current value means "unchanged
 * since purchase" rather than zero.
 */
function parseAmountPair(
  values: AssetFormValues,
  missingPrincipalError: string
): { principal: number; current: number } | { error: string } {
  const principal = parseOptionalPositive(values.purchasePrice);
  if (principal === undefined || principal === null) return { error: missingPrincipalError };
  const current = parseOptionalPositive(values.currentValue);
  if (current === null) return { error: "현재 평가 금액을 올바르게 입력해 주세요." };
  return { principal, current: current ?? principal };
}

/**
 * 현재가 is never typed in. It resolves in this order: live quote → 평단가 →
 * (when editing, and only if the currency still matches) the stored price.
 */
function buildStock(
  values: AssetFormValues,
  editingAsset: Asset | null,
  quote: QuoteOutcome,
  base: { name: string; currency: Currency; owner: AssetOwner }
): BuildResult {
  const quantity = parseOptionalPositive(values.quantity);
  if (quantity === undefined || quantity === null) {
    return { ok: false, error: "보유 수량을 올바르게 입력해 주세요." };
  }
  const avgPrice = parseOptionalPositive(values.avgPrice);
  if (avgPrice === null) return { ok: false, error: "평단가를 올바르게 입력해 주세요." };

  const stored = editingAsset?.type === "STOCK" ? editingAsset : null;
  // A stored price in a different currency is a different number entirely.
  const storedPrice =
    stored && (stored.currency ?? "KRW") === base.currency ? stored.currentPrice : undefined;

  const quotedPrice = quote.status === "OK" ? quote.price : undefined;
  const currentPrice = quotedPrice ?? avgPrice ?? storedPrice;
  if (currentPrice === undefined) {
    return {
      ok: false,
      error: values.ticker.trim()
        ? "현재가 조회에 실패했습니다. 티커를 확인하거나 평단가를 입력해 주세요."
        : "티커(현재가 자동 조회) 또는 평단가 중 하나는 입력해 주세요.",
    };
  }

  // Sector: a manual choice wins, then the auto-fetched one, then whatever
  // was already stored.
  const sector =
    values.sector.trim() ||
    (quote.status === "OK" ? quote.sector : undefined) ||
    stored?.sector ||
    undefined;

  // Sub-sector qualifies a base sector, so it's meaningless without one.
  const subSector = values.subSector.trim();

  return {
    ok: true,
    input: {
      ...base,
      type: "STOCK",
      market: values.market.trim() || undefined,
      ticker: values.ticker.trim() || undefined,
      quantity,
      avgPrice: avgPrice ?? currentPrice,
      currentPrice,
      sector,
      subSector: sector && subSector ? subSector : undefined,
    },
    warning:
      quote.status === "FAILED" && currentPrice !== undefined
        ? "현재가 조회에 실패해 입력된 값으로 대신 계산했습니다."
        : undefined,
  };
}
