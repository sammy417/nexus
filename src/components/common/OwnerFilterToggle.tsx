"use client";

import { ASSET_OWNERS, OwnerFilter } from "@/lib/models/asset-owner";
import { useOwnerFilter } from "@/lib/owner-filter-context";
import { useSettings } from "@/lib/settings-context";

/** Segmented control scoping the views to one household member (or all). */
export default function OwnerFilterToggle() {
  const { ownerFilter, setOwnerFilter } = useOwnerFilter();
  const { ownerName, ownerColor } = useSettings();

  const options: { value: OwnerFilter; label: string; color: string | null }[] = [
    { value: "ALL", label: "전체", color: null },
    ...ASSET_OWNERS.map((owner) => ({
      value: owner as OwnerFilter,
      label: ownerName(owner),
      color: ownerColor(owner),
    })),
  ];

  return (
    <div className="flex gap-1 rounded-lg bg-gray-50 p-0.5 dark:bg-white/5">
      {options.map(({ value, label, color }) => (
        <button
          key={value}
          type="button"
          onClick={() => setOwnerFilter(value)}
          className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
            ownerFilter === value
              ? "bg-white text-gray-900 shadow-sm dark:bg-white/15 dark:text-gray-100"
              : "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          }`}
        >
          {color && (
            <span
              aria-hidden
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: color }}
            />
          )}
          {label}
        </button>
      ))}
    </div>
  );
}
