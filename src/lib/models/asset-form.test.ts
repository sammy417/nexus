import { describe, expect, it } from "vitest";
import { Asset, StockAsset } from "./asset";
import {
  AssetFormValues,
  buildAssetInput,
  initialFormValues,
  needsQuoteLookup,
  parseOptionalPositive,
  QuoteOutcome,
} from "./asset-form";

const NO_QUOTE: QuoteOutcome = { status: "NONE" };

function values(over: Partial<AssetFormValues> = {}): AssetFormValues {
  return { ...initialFormValues(null), name: "테스트", ...over };
}

/** buildAssetInput result narrowed to the success case, or a thrown failure. */
function built(
  over: Partial<AssetFormValues>,
  editing: Asset | null = null,
  quote: QuoteOutcome = NO_QUOTE
) {
  const result = buildAssetInput(values(over), editing, quote);
  if (!result.ok) throw new Error(`expected success, got: ${result.error}`);
  return result;
}

function errorFrom(
  over: Partial<AssetFormValues>,
  editing: Asset | null = null,
  quote: QuoteOutcome = NO_QUOTE
): string {
  const result = buildAssetInput(values(over), editing, quote);
  if (result.ok) throw new Error("expected a validation error");
  return result.error;
}

const storedStock: StockAsset = {
  id: "s1",
  type: "STOCK",
  name: "엔비디아",
  currency: "USD",
  market: "NASDAQ",
  ticker: "NVDA",
  quantity: 10,
  avgPrice: 100,
  currentPrice: 175,
  sector: "기술",
  subSector: "반도체",
  createdAt: "2026-01-01",
  updatedAt: "2026-01-01",
};

describe("parseOptionalPositive", () => {
  it("separates empty (undefined) from invalid (null)", () => {
    expect(parseOptionalPositive("")).toBeUndefined();
    expect(parseOptionalPositive("   ")).toBeUndefined();
    expect(parseOptionalPositive("abc")).toBeNull();
    expect(parseOptionalPositive("0")).toBeNull();
    expect(parseOptionalPositive("-5")).toBeNull();
    expect(parseOptionalPositive("12.5")).toBe(12.5);
  });
});

describe("initialFormValues", () => {
  it("starts a new entry on 주식 · 원화 · 본인", () => {
    const fresh = initialFormValues(null);
    expect(fresh.type).toBe("STOCK");
    expect(fresh.currency).toBe("KRW");
    expect(fresh.owner).toBe("SELF");
    expect(fresh.name).toBe("");
  });

  it("pre-fills from the asset being edited", () => {
    const form = initialFormValues(storedStock);
    expect(form).toMatchObject({
      type: "STOCK",
      currency: "USD",
      name: "엔비디아",
      ticker: "NVDA",
      quantity: "10",
      avgPrice: "100",
      sector: "기술",
      subSector: "반도체",
    });
  });

  it("reads an untagged asset as 공동 rather than 본인", () => {
    expect(initialFormValues({ ...storedStock, owner: undefined }).owner).toBe("JOINT");
  });

  it("leaves fields belonging to other types empty", () => {
    const form = initialFormValues(storedStock);
    // A stock has no balance/category/coupon — these must not carry over.
    expect([form.balance, form.category, form.couponRate, form.accountType]).toEqual([
      "",
      "",
      "",
      "",
    ]);
  });

  it("maps 연금's 납입 원금 onto the shared principal field", () => {
    const form = initialFormValues({
      id: "p",
      type: "PENSION",
      name: "IRP",
      accountType: "IRP",
      principalPaid: 10_000_000,
      currentValue: 12_000_000,
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    });
    expect(form.purchasePrice).toBe("10000000");
    expect(form.currentValue).toBe("12000000");
  });
});

describe("needsQuoteLookup", () => {
  it("only looks up stocks that carry a ticker", () => {
    expect(needsQuoteLookup(values({ type: "STOCK", ticker: "AAPL" }))).toBe(true);
    expect(needsQuoteLookup(values({ type: "STOCK", ticker: "  " }))).toBe(false);
    expect(needsQuoteLookup(values({ type: "CASH", ticker: "AAPL" }))).toBe(false);
  });
});

describe("buildAssetInput — shared rules", () => {
  it("requires a name for every type", () => {
    expect(errorFrom({ name: "   ", type: "CASH", balance: "1000" })).toBe(
      "이름을 입력해 주세요."
    );
  });

  it("trims the name and carries currency and owner through", () => {
    const { input } = built({
      name: "  현금  ",
      type: "CASH",
      balance: "1000",
      currency: "USD",
      owner: "SPOUSE",
    });
    expect(input).toMatchObject({ name: "현금", currency: "USD", owner: "SPOUSE" });
  });
});

describe("buildAssetInput — 주식", () => {
  it("resolves 현재가 from the live quote when there is one", () => {
    const { input } = built({ type: "STOCK", quantity: "10", avgPrice: "100" }, null, {
      status: "OK",
      price: 175,
    });
    expect(input).toMatchObject({ type: "STOCK", currentPrice: 175, avgPrice: 100 });
  });

  it("falls back to 평단가 when the lookup fails, and says so", () => {
    const result = buildAssetInput(
      values({ type: "STOCK", ticker: "NVDA", quantity: "10", avgPrice: "100" }),
      null,
      { status: "FAILED" }
    );
    if (!result.ok) throw new Error(result.error);
    expect(result.input).toMatchObject({ currentPrice: 100 });
    expect(result.warning).toBe("현재가 조회에 실패해 입력된 값으로 대신 계산했습니다.");
  });

  it("falls back to the stored price when editing with no 평단가", () => {
    const { input } = built(
      { type: "STOCK", currency: "USD", quantity: "10", avgPrice: "", ticker: "NVDA" },
      storedStock,
      { status: "FAILED" }
    );
    expect(input).toMatchObject({ currentPrice: 175, avgPrice: 175 });
  });

  it("refuses the stored price once the currency has been switched", () => {
    // 175 was a USD price; reusing it as KRW would be off by ~1400×.
    expect(
      errorFrom(
        { type: "STOCK", currency: "KRW", quantity: "10", avgPrice: "", ticker: "NVDA" },
        storedStock,
        { status: "FAILED" }
      )
    ).toBe("현재가 조회에 실패했습니다. 티커를 확인하거나 평단가를 입력해 주세요.");
  });

  it("asks for a ticker or a 평단가 when it has neither", () => {
    expect(errorFrom({ type: "STOCK", quantity: "10", avgPrice: "", ticker: "" })).toBe(
      "티커(현재가 자동 조회) 또는 평단가 중 하나는 입력해 주세요."
    );
  });

  it("rejects a missing or invalid 보유 수량", () => {
    expect(errorFrom({ type: "STOCK", quantity: "", avgPrice: "100" })).toBe(
      "보유 수량을 올바르게 입력해 주세요."
    );
    expect(errorFrom({ type: "STOCK", quantity: "0", avgPrice: "100" })).toBe(
      "보유 수량을 올바르게 입력해 주세요."
    );
  });

  it("rejects an invalid 평단가 instead of silently ignoring it", () => {
    expect(errorFrom({ type: "STOCK", quantity: "10", avgPrice: "-3" })).toBe(
      "평단가를 올바르게 입력해 주세요."
    );
  });

  it("prefers a manually chosen sector over the looked-up one", () => {
    const { input } = built(
      { type: "STOCK", quantity: "1", avgPrice: "1", sector: "금융" },
      null,
      { status: "OK", price: 10, sector: "기술" }
    );
    expect(input).toMatchObject({ sector: "금융" });
  });

  it("uses the looked-up sector when none was chosen", () => {
    const { input } = built({ type: "STOCK", quantity: "1", avgPrice: "1" }, null, {
      status: "OK",
      price: 10,
      sector: "기술",
    });
    expect(input).toMatchObject({ sector: "기술" });
  });

  it("keeps the stored sector when neither is available", () => {
    const { input } = built(
      { type: "STOCK", currency: "USD", quantity: "1", avgPrice: "1", sector: "" },
      storedStock,
      { status: "FAILED" }
    );
    expect(input).toMatchObject({ sector: "기술" });
  });

  it("drops a sub-sector that has no base sector to qualify", () => {
    const withSector = built({
      type: "STOCK",
      quantity: "1",
      avgPrice: "1",
      sector: "기술",
      subSector: " 반도체 ",
    });
    expect(withSector.input).toMatchObject({ subSector: "반도체" });

    const withoutSector = built({
      type: "STOCK",
      quantity: "1",
      avgPrice: "1",
      sector: "",
      subSector: "반도체",
    });
    expect(withoutSector.input).toMatchObject({ subSector: undefined });
  });

  it("stores blank optional text as undefined rather than an empty string", () => {
    const { input } = built({
      type: "STOCK",
      quantity: "1",
      avgPrice: "1",
      market: "  ",
      ticker: "  ",
    });
    expect(input).toMatchObject({ market: undefined, ticker: undefined });
  });
});

describe("buildAssetInput — 채권 · 연금 · 기타", () => {
  it("treats a blank 현재 평가 금액 as unchanged from the principal", () => {
    for (const type of ["BOND", "PENSION", "CUSTOM"] as const) {
      const { input } = built({ type, purchasePrice: "1000000", currentValue: "" });
      const record = input as Record<string, unknown>;
      expect(record.currentValue).toBe(1_000_000);
    }
  });

  it("requires the principal, with a label matching the type", () => {
    expect(errorFrom({ type: "BOND", purchasePrice: "" })).toBe(
      "매입 금액을 올바르게 입력해 주세요."
    );
    expect(errorFrom({ type: "CUSTOM", purchasePrice: "" })).toBe(
      "매입 금액을 올바르게 입력해 주세요."
    );
    expect(errorFrom({ type: "PENSION", purchasePrice: "" })).toBe(
      "납입 원금을 올바르게 입력해 주세요."
    );
  });

  it("rejects an invalid 현재 평가 금액", () => {
    expect(errorFrom({ type: "BOND", purchasePrice: "1000", currentValue: "-1" })).toBe(
      "현재 평가 금액을 올바르게 입력해 주세요."
    );
  });

  it("accepts a 0% coupon but not a negative one", () => {
    expect(
      built({ type: "BOND", purchasePrice: "1000", couponRate: "0" }).input
    ).toMatchObject({ couponRate: 0 });
    expect(errorFrom({ type: "BOND", purchasePrice: "1000", couponRate: "-1" })).toBe(
      "표면금리를 올바르게 입력해 주세요."
    );
    expect(errorFrom({ type: "BOND", purchasePrice: "1000", couponRate: "abc" })).toBe(
      "표면금리를 올바르게 입력해 주세요."
    );
  });

  it("omits an unset coupon and maturity rather than storing empties", () => {
    const { input } = built({ type: "BOND", purchasePrice: "1000" });
    expect(input).toMatchObject({ couponRate: undefined, maturityDate: undefined });
  });

  it("stores the 실거주 주택 flag only when it is on", () => {
    expect(
      built({ type: "CUSTOM", purchasePrice: "1000", isHome: true }).input
    ).toMatchObject({ isHome: true });
    // Off is stored as undefined so pre-flag records stay indistinguishable.
    expect(
      built({ type: "CUSTOM", purchasePrice: "1000", isHome: false }).input
    ).toMatchObject({ isHome: undefined });
  });

  it("maps the shared principal field onto 연금's own key", () => {
    const { input } = built({ type: "PENSION", purchasePrice: "5000000", accountType: " IRP " });
    expect(input).toMatchObject({ type: "PENSION", principalPaid: 5_000_000, accountType: "IRP" });
  });
});

describe("buildAssetInput — 현금", () => {
  it("requires a positive balance", () => {
    expect(errorFrom({ type: "CASH", balance: "" })).toBe("금액을 올바르게 입력해 주세요.");
    expect(errorFrom({ type: "CASH", balance: "0" })).toBe("금액을 올바르게 입력해 주세요.");
    expect(built({ type: "CASH", balance: "3000000" }).input).toMatchObject({
      type: "CASH",
      balance: 3_000_000,
    });
  });
});
