import { Skeleton, SkeletonCard, SkeletonPageHeader } from "@/components/common/Skeleton";

/** Mirrors the stocks page: tiles + sector donut/exposure + table. */
export default function StocksSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <SkeletonPageHeader title="주식" />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} className="p-5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-2 h-7 w-28" />
          </SkeletonCard>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SkeletonCard className="flex flex-col items-center">
          <Skeleton className="h-4 w-24 self-start" />
          <Skeleton className="mt-4 h-[180px] w-[180px] rounded-full" />
          <div className="mt-5 flex w-full flex-col gap-2.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </SkeletonCard>
        <SkeletonCard>
          <Skeleton className="h-4 w-24" />
          <div className="mt-4 flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        </SkeletonCard>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-card-dark">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between border-b border-border py-3 last:border-0 dark:border-border-dark">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-28" />
          </div>
        ))}
      </div>
    </div>
  );
}
