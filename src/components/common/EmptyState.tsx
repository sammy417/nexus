"use client";

import type { LucideIcon } from "lucide-react";

interface EmptyStateAction {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
}

/**
 * Centered "nothing here yet" card with an optional call-to-action. Dashed
 * border + muted icon keeps it clearly distinct from a populated card.
 */
export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = "",
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  className?: string;
}) {
  return (
    <section
      className={`flex flex-col items-center rounded-2xl border border-dashed border-border bg-white px-6 py-16 text-center shadow-sm dark:border-border-dark dark:bg-card-dark ${className}`}
    >
      {Icon && (
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50 text-gray-400 dark:bg-white/5 dark:text-gray-500">
          <Icon size={22} strokeWidth={2} />
        </span>
      )}
      <p className="mt-4 text-base font-semibold text-gray-900 dark:text-gray-100">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-md text-sm leading-relaxed text-gray-400 dark:text-gray-500">
          {description}
        </p>
      )}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-5 flex items-center gap-1.5 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
        >
          {action.icon}
          {action.label}
        </button>
      )}
    </section>
  );
}
