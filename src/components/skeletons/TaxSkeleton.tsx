import { Skeleton, SkeletonCard, SkeletonPageHeader } from "@/components/common/Skeleton";

/** Mirrors the tax page: capital gains + financial income + pension credit. */
export default function TaxSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <SkeletonPageHeader title="세금" />
      <SkeletonCard>
        <Skeleton className="h-4 w-56" />
        <Skeleton className="mt-1 h-3 w-72" />
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      </SkeletonCard>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SkeletonCard>
          <Skeleton className="h-4 w-40" />
          <Skeleton className="mt-1 h-3 w-56" />
          <Skeleton className="mt-4 h-8 w-32" />
          <Skeleton className="mt-3 h-2.5 w-full rounded-full" />
        </SkeletonCard>
        <SkeletonCard>
          <Skeleton className="h-4 w-40" />
          <Skeleton className="mt-1 h-3 w-56" />
          <Skeleton className="mt-4 h-24 w-full rounded-xl" />
        </SkeletonCard>
      </div>
    </div>
  );
}
