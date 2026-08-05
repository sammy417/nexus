"use client";

import { FormEvent, useCallback, useState } from "react";
import { useAssetModal } from "@/lib/asset-modal-context";
import { usePortfolio } from "@/lib/portfolio-context";
import { Asset, Currency } from "@/lib/models/asset";
import {
  AssetFormValues,
  buildAssetInput,
  initialFormValues,
  needsQuoteLookup,
  QuoteOutcome,
} from "@/lib/models/asset-form";
import { useT } from "@/lib/i18n/locale-context";

/** Quote in the currency the asset is denominated in. */
async function fetchQuote(
  ticker: string,
  market: string,
  currency: Currency
): Promise<{ price: number; sector?: string }> {
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
  const price =
    currency === "KRW"
      ? data.priceKrw
      : data.currency === "USD"
        ? data.price
        : data.priceKrw / data.usdKrw;
  return { price, sector: typeof data.sector === "string" ? data.sector : undefined };
}

/** Look up the ticker, treating any failure as a fallback rather than an error. */
async function resolveQuote(values: AssetFormValues): Promise<QuoteOutcome> {
  if (!needsQuoteLookup(values)) return { status: "NONE" };
  try {
    const { price, sector } = await fetchQuote(
      values.ticker.trim(),
      values.market.trim(),
      values.currency
    );
    return { status: "OK", price, sector };
  } catch {
    return { status: "FAILED" };
  }
}

export type SetField = <K extends keyof AssetFormValues>(
  key: K,
  value: AssetFormValues[K]
) => void;

/**
 * All the behavior behind the add/edit modal: one bag of form state, the
 * quote lookup, and the save/delete calls. The validation and assembly
 * rules live in `models/asset-form.ts`, which is where the tests point.
 */
export function useAssetForm(editingAsset: Asset | null) {
  const { closeModal, showToast } = useAssetModal();
  const { addAsset, updateAsset, deleteAsset } = usePortfolio();
  const t = useT();

  const [values, setValues] = useState<AssetFormValues>(() => initialFormValues(editingAsset));
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setField = useCallback<SetField>((key, value) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = buildAssetInput(values, editingAsset, await resolveQuote(values));
      if (!result.ok) {
        setError(t(result.error));
        return;
      }
      if (result.warning) showToast(t(result.warning));

      if (editingAsset) {
        await updateAsset(editingAsset.id, result.input);
        showToast(t("{name} 정보가 수정되었습니다.", { name: result.input.name }));
      } else {
        await addAsset(result.input);
        showToast(t("{name} 자산이 추가되었습니다.", { name: result.input.name }));
      }
      closeModal();
    } catch (err) {
      const detail = err instanceof Error && err.message ? ` (${err.message})` : "";
      setError(t("저장에 실패했습니다. 잠시 후 다시 시도해 주세요.") + detail);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!editingAsset) return;
    const confirmed = window.confirm(t("{name} 자산을 삭제할까요?", { name: editingAsset.name }));
    if (!confirmed) return;
    await deleteAsset(editingAsset.id);
    showToast(t("{name} 자산이 삭제되었습니다.", { name: editingAsset.name }));
    closeModal();
  }

  return {
    values,
    setField,
    error,
    isSubmitting,
    isEditing: editingAsset !== null,
    handleSubmit,
    handleDelete,
  };
}
