"use client";

import { FormEvent, useState } from "react";
import { Trash2, X } from "lucide-react";
import { useAssetModal } from "@/lib/asset-modal-context";
import { AssetInput, usePortfolio } from "@/lib/portfolio-context";
import { ASSET_TYPE_LABEL, ASSET_TYPES, Asset, AssetType } from "@/lib/types";

const inputClass =
  "rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-300 focus:ring-2 focus:ring-gray-900/10";
const labelClass = "flex flex-col gap-1.5";
const labelTextClass = "text-xs font-medium text-gray-500";

export default function AssetFormModal() {
  const { isOpen, editingAsset, closeModal } = useAssetModal();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
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

function AssetFormSheet({ editingAsset }: { editingAsset: Asset | null }) {
  const { closeModal, showToast } = useAssetModal();
  const { addAsset, updateAsset, deleteAsset } = usePortfolio();
  const isEditing = editingAsset !== null;

  const [type, setType] = useState<AssetType>(editingAsset?.type ?? "STOCK");
  const [name, setName] = useState(editingAsset?.name ?? "");
  const [ticker, setTicker] = useState(
    editingAsset?.type === "STOCK" ? editingAsset.ticker ?? "" : ""
  );
  const [quantity, setQuantity] = useState(
    editingAsset?.type === "STOCK" ? String(editingAsset.quantity) : ""
  );
  const [avgPrice, setAvgPrice] = useState(
    editingAsset?.type === "STOCK" ? String(editingAsset.avgPrice) : ""
  );
  const [currentPrice, setCurrentPrice] = useState(
    editingAsset?.type === "STOCK" ? String(editingAsset.currentPrice) : ""
  );
  const [amount, setAmount] = useState(
    editingAsset?.type === "CASH" ? String(editingAsset.amount) : ""
  );
  const [purchasePrice, setPurchasePrice] = useState(
    editingAsset?.type === "REAL_ESTATE" ? String(editingAsset.purchasePrice) : ""
  );
  const [currentValue, setCurrentValue] = useState(
    editingAsset?.type === "REAL_ESTATE" ? String(editingAsset.currentValue) : ""
  );
  const [error, setError] = useState<string | null>(null);

  function buildInput(): AssetInput | null {
    const trimmedName = name.trim();
    if (!trimmedName) return null;

    if (type === "STOCK") {
      const q = Number(quantity);
      const avg = Number(avgPrice);
      const cur = Number(currentPrice);
      if (q <= 0 || avg <= 0 || cur <= 0) return null;
      return {
        type: "STOCK",
        name: trimmedName,
        ticker: ticker.trim() || undefined,
        quantity: q,
        avgPrice: avg,
        currentPrice: cur,
      };
    }

    if (type === "CASH") {
      const amt = Number(amount);
      if (amt <= 0) return null;
      return { type: "CASH", name: trimmedName, amount: amt };
    }

    const pp = Number(purchasePrice);
    const cv = Number(currentValue);
    if (pp <= 0 || cv <= 0) return null;
    return { type: "REAL_ESTATE", name: trimmedName, purchasePrice: pp, currentValue: cv };
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const input = buildInput();
    if (!input) {
      setError("모든 항목을 올바르게 입력해 주세요.");
      return;
    }

    if (isEditing && editingAsset) {
      updateAsset(editingAsset.id, input);
      showToast(`${input.name} 정보가 수정되었습니다.`);
    } else {
      addAsset(input);
      showToast(`${input.name} 자산이 추가되었습니다.`);
    }
    closeModal();
  }

  function handleDelete() {
    if (!editingAsset) return;
    const confirmed = window.confirm(`${editingAsset.name} 자산을 삭제할까요?`);
    if (!confirmed) return;
    deleteAsset(editingAsset.id);
    showToast(`${editingAsset.name} 자산이 삭제되었습니다.`);
    closeModal();
  }

  return (
    <div className="relative w-full max-w-md rounded-t-2xl bg-white px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4 shadow-xl">
      <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-gray-200" />

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">{isEditing ? "자산 수정" : "자산 추가"}</h2>
        <button
          type="button"
          aria-label="닫기"
          onClick={closeModal}
          className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100"
        >
          <X size={18} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 flex max-h-[70vh] flex-col gap-4 overflow-y-auto">
        <div className="grid grid-cols-3 gap-2">
          {ASSET_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              disabled={isEditing}
              onClick={() => setType(t)}
              className={`rounded-xl py-2.5 text-sm font-semibold transition-colors ${
                type === t ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-400"
              } ${isEditing ? "cursor-not-allowed opacity-50" : ""}`}
            >
              {ASSET_TYPE_LABEL[t]}
            </button>
          ))}
        </div>

        <label className={labelClass}>
          <span className={labelTextClass}>{type === "STOCK" ? "종목명" : "자산명"}</span>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={
              type === "STOCK" ? "예: 삼성전자" : type === "CASH" ? "예: 입출금 통장" : "예: OO 아파트"
            }
            required
            className={inputClass}
          />
        </label>

        {type === "STOCK" && (
          <>
            <label className={labelClass}>
              <span className={labelTextClass}>티커 (선택)</span>
              <input
                type="text"
                value={ticker}
                onChange={(event) => setTicker(event.target.value)}
                placeholder="예: 005930"
                className={inputClass}
              />
            </label>
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
                <span className={labelTextClass}>평단가</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  value={avgPrice}
                  onChange={(event) => setAvgPrice(event.target.value)}
                  placeholder="0"
                  required
                  className={inputClass}
                />
              </label>
            </div>
            <label className={labelClass}>
              <span className={labelTextClass}>현재가</span>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                value={currentPrice}
                onChange={(event) => setCurrentPrice(event.target.value)}
                placeholder="0"
                required
                className={inputClass}
              />
            </label>
          </>
        )}

        {type === "CASH" && (
          <label className={labelClass}>
            <span className={labelTextClass}>금액</span>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0"
              required
              className={inputClass}
            />
          </label>
        )}

        {type === "REAL_ESTATE" && (
          <div className="grid grid-cols-2 gap-3">
            <label className={labelClass}>
              <span className={labelTextClass}>매입가</span>
              <input
                type="number"
                inputMode="numeric"
                min="0"
                value={purchasePrice}
                onChange={(event) => setPurchasePrice(event.target.value)}
                placeholder="0"
                required
                className={inputClass}
              />
            </label>
            <label className={labelClass}>
              <span className={labelTextClass}>현재 시세</span>
              <input
                type="number"
                inputMode="numeric"
                min="0"
                value={currentValue}
                onChange={(event) => setCurrentValue(event.target.value)}
                placeholder="0"
                required
                className={inputClass}
              />
            </label>
          </div>
        )}

        {error && <p className="text-xs font-medium text-fall">{error}</p>}

        <div className="sticky bottom-0 mt-2 flex gap-2 bg-white pt-1">
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
            className="flex-1 rounded-xl bg-gray-900 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
          >
            {isEditing ? "수정하기" : "추가하기"}
          </button>
        </div>
      </form>
    </div>
  );
}
