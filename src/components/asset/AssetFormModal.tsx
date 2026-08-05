"use client";

import { Trash2, X } from "lucide-react";
import { useAssetModal } from "@/lib/asset-modal-context";
import { Asset } from "@/lib/models/asset";
import { useT } from "@/lib/i18n/locale-context";
import { useAssetForm } from "./use-asset-form";
import { CurrencyPicker, NameField, OwnerPicker, TypePicker } from "./fields/CommonFields";
import StockFields from "./fields/StockFields";
import { BondFields, CashFields, CustomFields, PensionFields } from "./fields/ValueFields";

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
      {/* Keyed so switching which asset is being edited remounts with fresh state. */}
      <AssetFormSheet key={editingAsset?.id ?? "new"} editingAsset={editingAsset} />
    </div>
  );
}

/**
 * The dialog frame and layout. Everything type-specific lives in the field
 * groups under `fields/`, and every rule about what actually gets stored is
 * in `models/asset-form.ts` — this component only arranges them.
 */
function AssetFormSheet({ editingAsset }: { editingAsset: Asset | null }) {
  const { closeModal } = useAssetModal();
  const t = useT();
  const { values, setField, error, isSubmitting, isEditing, handleSubmit, handleDelete } =
    useAssetForm(editingAsset);

  return (
    <div className="relative w-full max-w-lg rounded-2xl bg-white px-6 pb-6 pt-5 shadow-xl dark:bg-card-dark">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
          {isEditing ? t("자산 수정") : t("자산 추가")}
        </h2>
        <button
          type="button"
          aria-label={t("닫기")}
          onClick={closeModal}
          className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10"
        >
          <X size={18} />
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-5 flex max-h-[70vh] flex-col gap-4 overflow-y-auto"
      >
        <TypePicker
          type={values.type}
          disabled={isEditing}
          onChange={(type) => setField("type", type)}
        />
        <CurrencyPicker
          currency={values.currency}
          onChange={(currency) => setField("currency", currency)}
        />
        <OwnerPicker values={values} setField={setField} />
        <NameField values={values} setField={setField} />

        {values.type === "STOCK" && (
          <StockFields values={values} setField={setField} editingAsset={editingAsset} />
        )}
        {values.type === "BOND" && <BondFields values={values} setField={setField} />}
        {values.type === "PENSION" && <PensionFields values={values} setField={setField} />}
        {values.type === "CUSTOM" && <CustomFields values={values} setField={setField} />}
        {values.type === "CASH" && <CashFields values={values} setField={setField} />}

        {error && <p className="text-xs font-medium text-fall">{error}</p>}

        <div className="sticky bottom-0 mt-2 flex gap-2 bg-white pt-1 dark:bg-card-dark">
          {isEditing && (
            <button
              type="button"
              onClick={handleDelete}
              aria-label={t("삭제")}
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
              ? values.type === "STOCK"
                ? t("현재가 조회 중...")
                : t("저장 중...")
              : isEditing
                ? t("수정하기")
                : t("추가하기")}
          </button>
        </div>
      </form>
    </div>
  );
}
