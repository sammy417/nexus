"use client";

import { AlertTriangle } from "lucide-react";
import { useT } from "@/lib/i18n/locale-context";

const ALERT = "#c98500";

/**
 * "This came from an external source and the lookup failed" notice.
 *
 * Deliberately distinct from the empty states: an empty state means the
 * answer really is nothing, while this means the number on screen may be
 * wrong (usually understated) because data is missing. Rendered as a
 * warning strip so it can sit inside a card without replacing its content.
 */
export default function DataErrorNotice({
  message,
  className = "",
}: {
  /** Korean source string (an i18n key). */
  message: string;
  className?: string;
}) {
  const t = useT();
  return (
    <p
      role="status"
      className={`flex items-start gap-2 rounded-xl px-3 py-2 text-[11px] font-medium leading-relaxed ${className}`}
      style={{ color: ALERT, backgroundColor: `${ALERT}1f` }}
    >
      <AlertTriangle size={13} strokeWidth={2.25} className="mt-px shrink-0" />
      <span>{t(message)}</span>
    </p>
  );
}
