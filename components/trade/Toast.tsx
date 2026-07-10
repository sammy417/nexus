"use client";

import { useTradeModal } from "@/lib/trade-modal-context";

export default function Toast() {
  const { toastMessage } = useTradeModal();

  if (!toastMessage) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-40 flex justify-center px-5">
      <div className="rounded-full bg-gray-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg">
        {toastMessage}
      </div>
    </div>
  );
}
