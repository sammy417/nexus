import { Skeleton, SkeletonCard, SkeletonPageHeader } from "@/components/common/Skeleton";

function StatTileSkeleton() {
  return (
    <SkeletonCard className="p-5">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-2 h-7 w-20" />
      <Skeleton className="mt-1 h-3 w-16" />
    </SkeletonCard>
  );
}

function ChartCardSkeleton() {
  return (
    <SkeletonCard>
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-1 h-3 w-40" />
      <Skeleton className="mt-4 h-[220px] w-full rounded-xl" />
    </SkeletonCard>
  );
}

/** Mirrors the analytics page: stat tiles + two charts + growth chart. */
export default function AnalyticsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <SkeletonPageHeader title="분석" />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatTileSkeleton key={i} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ChartCardSkeleton />
        <ChartCardSkeleton />
      </div>

      <ChartCardSkeleton />
    </div>
  );
}
