import { Skeleton, SkeletonCard, SkeletonPageHeader } from "@/components/common/Skeleton";

/** Mirrors the dividends page: stat tiles + forecast/upcoming + monthly chart. */
export default function DividendsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <SkeletonPageHeader title="배당" />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} className="p-5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-2 h-7 w-28" />
          </SkeletonCard>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[3fr_2fr]">
        <SkeletonCard>
          <Skeleton className="h-4 w-28" />
          <Skeleton className="mt-1 h-3 w-48" />
          <Skeleton className="mt-4 h-9 w-40" />
          <div className="mt-4 flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </SkeletonCard>

        <SkeletonCard>
          <Skeleton className="h-4 w-28" />
          <Skeleton className="mt-1 h-3 w-40" />
          <div className="mt-4 flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
                <div className="flex flex-1 flex-col gap-1.5">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </SkeletonCard>
      </div>

      <SkeletonCard>
        <Skeleton className="h-4 w-20" />
        <Skeleton className="mt-1 h-3 w-32" />
        <Skeleton className="mt-4 h-[200px] w-full rounded-xl" />
      </SkeletonCard>
    </div>
  );
}
