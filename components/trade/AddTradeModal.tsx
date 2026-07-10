"use client";

import { FormEvent, useState } from "react";
import { X } from "lucide-react";
import { useTradeModal } from "@/lib/trade-modal-context";
import { usePortfolio } from "@/lib/portfolio-context";
import { TradeType } from "@/lib/types";

export default function AddTradeModal() {
  const { isOpen, closeModal, showToast } = useTradeModal();
  const { addTrade } = usePortfolio();
  const [stockName, setStockName] = useState("");
  const [type, setType] = useState<TradeType>("BUY");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setStockName("");
    setType("BUY");
    setPrice("");
    setQuantity("");
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    closeModal();
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    const trimmedName = stockName.trim();
    const parsedPrice = Number(price);
    const parsedQuantity = Number(quantity);

    if (!trimmedName || parsedPrice <= 0 || parsedQuantity <= 0) {
      setError("종목명, 단가, 수량을 올바르게 입력해 주세요.");
      return;
    }

    const result = addTrade({
      stockName: trimmedName,
      type,
      price: parsedPrice,
      quantity: parsedQuantity,
    });

    if (!result.ok) {
      setError(result.message);
      return;
    }

    const label = type === "BUY" ? "매수" : "매도";
    showToast(`${trimmedName} ${label} 내역이 추가되었습니다.`);
    resetForm();
    closeModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        type="button"
        aria-label="닫기"
        onClick={handleClose}
        className="absolute inset-0 bg-black/40"
      />

      <div className="relative w-full max-w-md rounded-t-2xl bg-white px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4 shadow-xl">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-gray-200" />

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">거래 추가</h2>
          <button
            type="button"
            aria-label="닫기"
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setType("BUY")}
              className={`rounded-xl py-2.5 text-sm font-semibold transition-colors ${
                type === "BUY"
                  ? "bg-rise/10 text-rise"
                  : "bg-gray-50 text-gray-400"
              }`}
            >
              매수
            </button>
            <button
              type="button"
              onClick={() => setType("SELL")}
              className={`rounded-xl py-2.5 text-sm font-semibold transition-colors ${
                type === "SELL"
                  ? "bg-fall/10 text-fall"
                  : "bg-gray-50 text-gray-400"
              }`}
            >
              매도
            </button>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-gray-500">종목명</span>
            <input
              type="text"
              value={stockName}
              onChange={(event) => setStockName(event.target.value)}
              placeholder="예: 삼성전자"
              required
              className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-300 focus:ring-2 focus:ring-gray-900/10"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-gray-500">단가</span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              placeholder="0"
              required
              className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-300 focus:ring-2 focus:ring-gray-900/10"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-gray-500">수량</span>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              placeholder="0"
              required
              className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-300 focus:ring-2 focus:ring-gray-900/10"
            />
          </label>

          {error && <p className="text-xs font-medium text-fall">{error}</p>}

          <button
            type="submit"
            className="mt-2 rounded-xl bg-gray-900 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
          >
            추가하기
          </button>
        </form>
      </div>
    </div>
  );
}
