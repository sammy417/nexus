/**
 * Loading placeholders. `Skeleton` is a single pulsing block; `SkeletonCard`
 * reuses the app's real card shell so the page keeps its shape (no layout
 * shift) while data loads. Gray tint works in both light and dark.
 */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-gray-100 dark:bg-white/[0.06] ${className}`} />;
}

export function SkeletonCard({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-2xl bg-white p-6 shadow-sm dark:bg-card-dark ${className}`}>
      {children}
    </div>
  );
}

/** Title + right-aligned control pills, matching each page's header row. */
export function SkeletonPageHeader({ title }: { title: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{title}</h1>
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-20 rounded-lg" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
    </div>
  );
}
