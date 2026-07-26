import { Skeleton, SkeletonCard, SkeletonPageHeader } from "@/components/common/Skeleton";

/** Mirrors the dashboard grid: summary + donut, trend chart, owner donut + preview. */
export default function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <SkeletonPageHeader title="대시보드" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <SkeletonCard className="flex flex-col justify-between lg:col-span-2">
          <div>
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-3 h-10 w-64" />
          </div>
          <div className="mt-8 grid grid-cols-2 gap-6 border-t border-border pt-6 dark:border-border-dark">
            <div>
              <Skeleton className="h-3 w-20" />
              <Skeleton className="mt-2 h-6 w-32" />
            </div>
            <div>
              <Skeleton className="h-3 w-20" />
              <Skeleton className="mt-2 h-6 w-32" />
            </div>
          </div>
        </SkeletonCard>

        <SkeletonCard className="flex flex-col items-center">
          <Skeleton className="h-4 w-24 self-start" />
          <Skeleton className="mt-4 h-[180px] w-[180px] rounded-full" />
          <div className="mt-5 flex w-full flex-col gap-2.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </SkeletonCard>

        <SkeletonCard className="lg:col-span-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-7 w-40 rounded-lg" />
          </div>
          <Skeleton className="mt-4 h-[240px] w-full rounded-xl" />
        </SkeletonCard>

        <SkeletonCard className="flex flex-col items-center">
          <Skeleton className="h-4 w-24 self-start" />
          <Skeleton className="mt-4 h-[180px] w-[180px] rounded-full" />
          <div className="mt-5 flex w-full flex-col gap-2.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </SkeletonCard>

        <SkeletonCard className="lg:col-span-2">
          <Skeleton className="h-4 w-24" />
          <div className="mt-4 flex flex-col gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex flex-col gap-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
            ))}
          </div>
        </SkeletonCard>
      </div>
    </div>
  );
}
