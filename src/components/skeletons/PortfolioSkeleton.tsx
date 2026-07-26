import { Skeleton, SkeletonCard, SkeletonPageHeader } from "@/components/common/Skeleton";

function CategorySectionSkeleton({ rows }: { rows: number }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between px-1">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-24" />
      </div>

      {/* Top holdings bar list */}
      <SkeletonCard className="px-5 py-4">
        <Skeleton className="h-3 w-20" />
        <div className="mt-3 flex flex-col gap-2.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="grid grid-cols-[9rem_1fr_auto] items-center gap-3">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-2.5 w-full rounded-full" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      </SkeletonCard>

      {/* Table */}
      <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-card-dark">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center justify-between border-b border-border py-3 last:border-0 dark:border-border-dark">
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-28" />
          </div>
        ))}
      </div>
    </section>
  );
}

/** Mirrors the portfolio page: header + two category sections (chart + table). */
export default function PortfolioSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <SkeletonPageHeader title="포트폴리오" />
      <CategorySectionSkeleton rows={4} />
      <CategorySectionSkeleton rows={3} />
    </div>
  );
}
