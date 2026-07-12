"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { Asset } from "./types";

interface AssetModalContextValue {
  isOpen: boolean;
  editingAsset: Asset | null;
  openAddModal: () => void;
  openEditModal: (asset: Asset) => void;
  closeModal: () => void;
  toastMessage: string | null;
  showToast: (message: string) => void;
}

const AssetModalContext = createContext<AssetModalContextValue | null>(null);

export function AssetModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const openAddModal = useCallback(() => {
    setEditingAsset(null);
    setIsOpen(true);
  }, []);

  const openEditModal = useCallback((asset: Asset) => {
    setEditingAsset(asset);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => setIsOpen(false), []);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 2000);
  }, []);

  const value = useMemo(
    () => ({ isOpen, editingAsset, openAddModal, openEditModal, closeModal, toastMessage, showToast }),
    [isOpen, editingAsset, openAddModal, openEditModal, closeModal, toastMessage, showToast]
  );

  return <AssetModalContext.Provider value={value}>{children}</AssetModalContext.Provider>;
}

export function useAssetModal() {
  const context = useContext(AssetModalContext);
  if (!context) {
    throw new Error("useAssetModal must be used within an AssetModalProvider");
  }
  return context;
}
