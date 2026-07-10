"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

interface TradeModalContextValue {
  isOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  toastMessage: string | null;
  showToast: (message: string) => void;
}

const TradeModalContext = createContext<TradeModalContextValue | null>(null);

export function TradeModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const openModal = useCallback(() => setIsOpen(true), []);
  const closeModal = useCallback(() => setIsOpen(false), []);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 2000);
  }, []);

  const value = useMemo(
    () => ({ isOpen, openModal, closeModal, toastMessage, showToast }),
    [isOpen, openModal, closeModal, toastMessage, showToast]
  );

  return (
    <TradeModalContext.Provider value={value}>{children}</TradeModalContext.Provider>
  );
}

export function useTradeModal() {
  const context = useContext(TradeModalContext);
  if (!context) {
    throw new Error("useTradeModal must be used within a TradeModalProvider");
  }
  return context;
}
