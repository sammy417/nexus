"use client";

import { FormEvent, useState } from "react";
import { Trash2, X } from "lucide-react";
import { useAssetModal } from "@/lib/asset-modal-context";
import { AssetInput, usePortfolio } from "@/lib/portfolio-context";
import { ASSET_TYPE_LABEL, ASSET_TYPES } from "@/lib/models/asset-types";
import { ASSET_OWNER_LABEL, ASSET_OWNERS } from "@/lib/models/asset-owner";
import { Asset, AssetOwner, AssetType, Currency } from "@/lib/models/asset";
import { formatKRW } from "@/lib/format";
import MoneyInput from "@/components/common/MoneyInput";

const inputClass =
  "rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-300 focus:ring-2 focus:ring-gray-900/10 dark:bg-white/5 dark:text-gray-100 dark:placeholder:text-gray-600 dark:focus:ring-white/10";
const labelClass = "flex flex-col gap-1.5";
const labelTextClass = "text-xs font-medium text-gray-500 dark:text-gray-400";
const hintTextClass = "text-[11px] leading-relaxed text-gray-400 dark:text-gray-500";

export default function AssetFormModal() {
  const { isOpen, editingAsset, closeModal } = useAssetModal();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <button
        type="button"
        aria-label="닫기"
        onClick={closeModal}
        className="absolute inset-0 bg-black/40"
      />
      <AssetFormSheet key={editingAsset?.id ?? "new"} editingAsset={editingAsset} />
    </div>
  );
}

/** Positive number from a text field; undefined when empty, null when invalid. */
function parseOptionalPositive(raw: string): number | undefined | null {
  const trimmed = raw.trim();
  if (trimmed === "") return undefined;
  const value = Number(trimmed);
  return Number.isFinite(value) && value > 0 ? value : null;
}

/** Quote in the currency the asset is denominated in. */
async function fetchQuotePrice(
  ticker: string,
  market: string,
  currency: Currency
): Promise<number> {
  const params = new URLSearchParams({ ticker });
  if (market) params.set("market", market);
  const response = await fetch(`/api/quote?${params.toString()}`);
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? `Quote request failed: ${response.status}`);
  }
  const data = await response.json();
  if (
    typeof data.price !== "number" ||
    data.price <= 0 ||
    typeof data.priceKrw !== "number" ||
    typeof data.usdKrw !== "number"
  ) {
    throw new Error("Quote returned no usable price");
  }
  if (currency === "KRW") return data.priceKrw;
  return data.currency === "USD" ? data.price : data.priceKrw / data.usdKrw;
}

function AssetFormSheet({ editingAsset }: { editingAsset: Asset | null }) {
  const { closeModal, showToast } = useAssetModal();
  const { addAsset, updateAsset, deleteAsset } = usePortfolio();
  const isEditing = editingAsset !== null;

  const [type, setType] = useState<AssetType>(editingAsset?.type ?? "STOCK");
  const [currency, setCurrency] = useState<Currency>(editingAsset?.currency ?? "KRW");
  // Editing keeps the stored owner (undefined = 공동); new entries default to 본인.
  const [owner, setOwner] = useState<AssetOwner>(
    editingAsset ? (editingAsset.owner ?? "JOINT") : "SELF"
  );
  const [name, setName] = useState(editingAsset?.name ?? "");
  const [category, setCategory] = useState(
    editingAsset?.type === "CUSTOM" ? editingAsset.category ?? "" : ""
  );
  const [accountType, setAccountType] = useState(
    editingAsset?.type === "PENSION" ? editingAsset.accountType ?? "" : ""
  );
  const [market, setMarket] = useState(
    editingAsset?.type === "STOCK" ? editingAsset.market ?? "" : ""
  );
  const [ticker, setTicker] = useState(
    editingAsset?.type === "STOCK" ? editingAsset.ticker ?? "" : ""
  );
  const [quantity, setQuantity] = useState(
    editingAsset?.type === "STOCK" ? String(editingAsset.quantity) : ""
  );
  const [avgPrice, setAvgPrice] = useState(
    editingAsset?.type === "STOCK" ? String(editingAsset.avgPrice) : ""
  );
  const [balance, setBalance] = useState(
    editingAsset?.type === "CASH" ? String(editingAsset.balance) : ""
  );
  const [purchasePrice, setPurchasePrice] = useState(
    editingAsset?.type === "BOND" || editingAsset?.type === "CUSTOM"
      ? String(editingAsset.purchasePrice)
      : editingAsset?.type === "PENSION"
        ? String(editingAsset.principalPaid)
        : ""
  );
  const [currentValue, setCurrentValue] = useState(
    editingAsset?.type === "BOND" ||
      editingAsset?.type === "CUSTOM" ||
      editingAsset?.type === "PENSION"
      ? String(editingAsset.currentValue)
      : ""
  );
  const [couponRate, setCouponRate] = useState(
    editingAsset?.type === "BOND" && editingAsset.couponRate !== undefined
      ? String(editingAsset.couponRate)
      : ""
  );
  const [maturityDate, setMaturityDate] = useState(
    editingAsset?.type === "BOND" ? editingAsset.maturityDate ?? "" : ""
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Resolve the final input, fetching the live price for stocks.
   * 현재가 is never typed in: ticker lookup → 평단가 → (editing) stored
   * price, in that order. Returns an error string when unresolvable.
   */
  async function resolveInput(): Promise<AssetInput | string> {
    const trimmedName = name.trim();
    if (!trimmedName) return "이름을 입력해 주세요.";

    if (type === "STOCK") {
      const q = parseOptionalPositive(quantity);
      if (q === undefined || q === null) return "보유 수량을 올바르게 입력해 주세요.";
      const avg = parseOptionalPositive(avgPrice);
      if (avg === null) return "평단가를 올바르게 입력해 주세요.";

      const trimmedTicker = ticker.trim();
      let quoted: number | undefined;
      let quoteFailed = false;
      if (trimmedTicker) {
        try {
          quoted = await fetchQuotePrice(trimmedTicker, market.trim(), currency);
        } catch {
          quoteFailed = true;
        }
      }

      const storedPrice =
        isEditing && editingAsset?.type === "STOCK" && (editingAsset.currency ?? "KRW") === currency
          ? editingAsset.currentPrice
          : undefined;
      const current = quoted ?? avg ?? storedPrice;
      if (current === undefined) {
        return trimmedTicker
          ? "현재가 조회에 실패했습니다. 티커를 확인하거나 평단가를 입력해 주세요."
          : "티커(현재가 자동 조회) 또는 평단가 중 하나는 입력해 주세요.";
      }
      if (quoteFailed && (avg !== undefined || storedPrice !== undefined)) {
        showToast("현재가 조회에 실패해 입력된 값으로 대신 계산했습니다.");
      }

      return {
        type: "STOCK",
        name: trimmedName,
        currency,
        market: market.trim() || undefined,
        ticker: trimmedTicker || undefined,
        quantity: q,
        avgPrice: avg ?? current,
        currentPrice: current,
      };
    }

    if (type === "BOND") {
      const pp = parseOptionalPositive(purchasePrice);
      if (pp === undefined || pp === null) return "매입 금액을 올바르게 입력해 주세요.";
      const cv = parseOptionalPositive(currentValue);
      if (cv === null) return "현재 평가 금액을 올바르게 입력해 주세요.";
      const rate = couponRate.trim() === "" ? undefined : Number(couponRate);
      if (rate !== undefined && (Number.isNaN(rate) || rate < 0))
        return "표면금리를 올바르게 입력해 주세요.";
      return {
        type: "BOND",
        name: trimmedName,
        currency,
        purchasePrice: pp,
        currentValue: cv ?? pp,
        couponRate: rate,
        maturityDate: maturityDate || undefined,
      };
    }

    if (type === "PENSION") {
      const pp = parseOptionalPositive(purchasePrice);
      if (pp === undefined || pp === null) return "납입 원금을 올바르게 입력해 주세요.";
      const cv = parseOptionalPositive(currentValue);
      if (cv === null) return "현재 평가 금액을 올바르게 입력해 주세요.";
      return {
        type: "PENSION",
        name: trimmedName,
        currency,
        accountType: accountType.trim() || undefined,
        principalPaid: pp,
        currentValue: cv ?? pp,
      };
    }

    if (type === "CUSTOM") {
      const pp = parseOptionalPositive(purchasePrice);
      if (pp === undefined || pp === null) return "매입 금액을 올바르게 입력해 주세요.";
      const cv = parseOptionalPositive(currentValue);
      if (cv === null) return "현재 평가 금액을 올바르게 입력해 주세요.";
      return {
        type: "CUSTOM",
        name: trimmedName,
        currency,
        category: category.trim() || undefined,
        purchasePrice: pp,
        currentValue: cv ?? pp,
      };
    }

    const amt = parseOptionalPositive(balance);
    if (amt === undefined || amt === null) return "금액을 올바르게 입력해 주세요.";
    return { type: "CASH", name: trimmedName, currency, balance: amt };
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const resolved = await resolveInput();
      if (typeof resolved === "string") {
        setError(resolved);
        return;
      }

      const withOwner = { ...resolved, owner };
      if (isEditing && editingAsset) {
        await updateAsset(editingAsset.id, withOwner);
        showToast(`${withOwner.name} 정보가 수정되었습니다.`);
      } else {
        await addAsset(withOwner);
        showToast(`${withOwner.name} 자산이 추가되었습니다.`);
      }
      closeModal();
    } catch (err) {
      const detail = err instanceof Error && err.message ? ` (${err.message})` : "";
      setError(`저장에 실패했습니다. 잠시 후 다시 시도해 주세요.${detail}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!editingAsset) return;
    const confirmed = window.confirm(`${editingAsset.name} 자산을 삭제할까요?`);
    if (!confirmed) return;
    await deleteAsset(editingAsset.id);
    showToast(`${editingAsset.name} 자산이 삭제되었습니다.`);
    closeModal();
  }

  return (
    <div className="relative w-full max-w-lg rounded-2xl bg-white px-6 pb-6 pt-5 shadow-xl dark:bg-card-dark">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
          {isEditing ? "자산 수정" : "자산 추가"}
        </h2>
        <button
          type="button"
          aria-label="닫기"
          onClick={closeModal}
          className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10"
        >
          <X size={18} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 flex max-h-[70vh] flex-col gap-4 overflow-y-auto">
        <div className="grid grid-cols-5 gap-2">
          {ASSET_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              disabled={isEditing}
              onClick={() => setType(t)}
              className={`rounded-xl py-2.5 text-sm font-semibold transition-colors ${
                type === t
                  ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                  : "bg-gray-50 text-gray-400 dark:bg-white/5 dark:text-gray-500"
              } ${isEditing ? "cursor-not-allowed opacity-50" : ""}`}
            >
              {ASSET_TYPE_LABEL[t]}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <span className={labelTextClass}>표시 금액 통화</span>
          <div className="flex gap-1 rounded-lg bg-gray-50 p-0.5 dark:bg-white/5">
            {(["KRW", "USD"] as Currency[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCurrency(c)}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                  currency === c
                    ? "bg-white text-gray-900 shadow-sm dark:bg-white/15 dark:text-gray-100"
                    : "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                }`}
              >
                {c === "KRW" ? "₩ 원화" : "$ 달러"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className={labelTextClass}>소유자</span>
          <div className="flex gap-1 rounded-lg bg-gray-50 p-0.5 dark:bg-white/5">
            {ASSET_OWNERS.map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => setOwner(o)}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                  owner === o
                    ? "bg-white text-gray-900 shadow-sm dark:bg-white/15 dark:text-gray-100"
                    : "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                }`}
              >
                {ASSET_OWNER_LABEL[o]}
              </button>
            ))}
          </div>
        </div>

        <label className={labelClass}>
          <span className={labelTextClass}>{type === "STOCK" ? "종목명" : "자산명"}</span>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={
              type === "STOCK"
                ? "예: 삼성전자"
                : type === "BOND"
                  ? "예: 국고채 3년"
                  : type === "PENSION"
                    ? "예: IRP 계좌 (미래에셋)"
                    : type === "CUSTOM"
                      ? "예: 자가 아파트, 금 현물"
                      : "예: 입출금 통장"
            }
            required
            className={inputClass}
          />
        </label>

        {type === "CUSTOM" && (
          <label className={labelClass}>
            <span className={labelTextClass}>카테고리 (선택)</span>
            <input
              type="text"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              placeholder="예: 부동산, 금, 암호화폐"
              className={inputClass}
            />
          </label>
        )}

        {type === "PENSION" && (
          <>
            <label className={labelClass}>
              <span className={labelTextClass}>계좌 유형 (선택)</span>
              <input
                type="text"
                value={accountType}
                onChange={(event) => setAccountType(event.target.value)}
                placeholder="예: DC, IRP, 연금저축"
                className={inputClass}
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className={labelClass}>
                <span className={labelTextClass}>납입 원금</span>
                <MoneyInput
                  value={purchasePrice}
                  onChange={setPurchasePrice}
                  currency={currency}
                  placeholder="0"
                  required
                  className={inputClass}
                />
              </label>
              <label className={labelClass}>
                <span className={labelTextClass}>현재 평가 금액 (선택)</span>
                <MoneyInput
                  value={currentValue}
                  onChange={setCurrentValue}
                  currency={currency}
                  placeholder="미입력 시 납입 원금과 동일"
                  className={inputClass}
                />
              </label>
            </div>
          </>
        )}

        {type === "STOCK" && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <label className={labelClass}>
                <span className={labelTextClass}>보유 수량</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  placeholder="0"
                  required
                  className={inputClass}
                />
              </label>
              <label className={labelClass}>
                <span className={labelTextClass}>티커 (선택)</span>
                <input
                  type="text"
                  value={ticker}
                  onChange={(event) => setTicker(event.target.value)}
                  placeholder="예: 005930, AAPL"
                  className={inputClass}
                />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className={labelClass}>
                <span className={labelTextClass}>시장 (선택)</span>
                <input
                  type="text"
                  value={market}
                  onChange={(event) => setMarket(event.target.value)}
                  placeholder="예: KOSPI, KOSDAQ, NASDAQ"
                  className={inputClass}
                />
              </label>
              <label className={labelClass}>
                <span className={labelTextClass}>평단가 (선택)</span>
                <MoneyInput
                  value={avgPrice}
                  onChange={setAvgPrice}
                  currency={currency}
                  placeholder="0"
                  className={inputClass}
                />
              </label>
            </div>
            <p className={hintTextClass}>
              현재가는 입력하지 않습니다 — 저장 시 티커로 자동 조회해 선택한 통화로 저장합니다
              (국내 6자리 코드·미국 티커 지원). 티커가 없거나 조회에 실패하면 평단가
              {isEditing ? "·기존 현재가" : ""}로 대신 계산합니다.
              {isEditing && editingAsset?.type === "STOCK" && (
                <>
                  {" "}현재 저장된 현재가:{" "}
                  {(editingAsset.currency ?? "KRW") === "USD"
                    ? `$${editingAsset.currentPrice.toLocaleString("en-US")}`
                    : formatKRW(editingAsset.currentPrice)}
                </>
              )}
            </p>
          </>
        )}

        {(type === "BOND" || type === "CUSTOM") && (
          <div className="grid grid-cols-2 gap-3">
            <label className={labelClass}>
              <span className={labelTextClass}>매입 금액</span>
              <MoneyInput
                value={purchasePrice}
                onChange={setPurchasePrice}
                currency={currency}
                placeholder="0"
                required
                className={inputClass}
              />
            </label>
            <label className={labelClass}>
              <span className={labelTextClass}>현재 평가 금액 (선택)</span>
              <MoneyInput
                value={currentValue}
                onChange={setCurrentValue}
                currency={currency}
                placeholder="미입력 시 매입 금액과 동일"
                className={inputClass}
              />
            </label>
          </div>
        )}

        {type === "BOND" && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <label className={labelClass}>
                <span className={labelTextClass}>표면금리 % (선택)</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={couponRate}
                  onChange={(event) => setCouponRate(event.target.value)}
                  placeholder="예: 3.25"
                  className={inputClass}
                />
              </label>
              <label className={labelClass}>
                <span className={labelTextClass}>만기일 (선택)</span>
                <input
                  type="date"
                  value={maturityDate}
                  onChange={(event) => setMaturityDate(event.target.value)}
                  className={`${inputClass} [color-scheme:light] dark:[color-scheme:dark]`}
                />
              </label>
            </div>
          </>
        )}

        {type === "CASH" && (
          <label className={labelClass}>
            <span className={labelTextClass}>금액</span>
            <MoneyInput
              value={balance}
              onChange={setBalance}
              currency={currency}
              placeholder="0"
              required
              className={inputClass}
            />
          </label>
        )}

        {error && <p className="text-xs font-medium text-fall">{error}</p>}

        <div className="sticky bottom-0 mt-2 flex gap-2 bg-white pt-1 dark:bg-card-dark">
          {isEditing && (
            <button
              type="button"
              onClick={handleDelete}
              aria-label="삭제"
              className="flex items-center justify-center rounded-xl bg-fall/10 px-4 py-3.5 text-fall transition-colors hover:bg-fall/20"
            >
              <Trash2 size={18} />
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 rounded-xl bg-gray-900 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:opacity-60 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
          >
            {isSubmitting
              ? type === "STOCK"
                ? "현재가 조회 중..."
                : "저장 중..."
              : isEditing
                ? "수정하기"
                : "추가하기"}
          </button>
        </div>
      </form>
    </div>
  );
}
