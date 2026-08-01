import { Skeleton, SkeletonCard, SkeletonPageHeader } from "@/components/common/Skeleton";

/** Mirrors the news page: header + a list of headline rows. */
export default function NewsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <SkeletonPageHeader title="뉴스" />
      <SkeletonCard className="p-0">
        <ul className="divide-y divide-gray-50 dark:divide-white/5">
          {Array.from({ length: 8 }).map((_, i) => (
            <li key={i} className="px-5 py-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-3 w-12" />
              </div>
              <Skeleton className="mt-2 h-4 w-3/4" />
              <Skeleton className="mt-1.5 h-3 w-1/2" />
            </li>
          ))}
        </ul>
      </SkeletonCard>
    </div>
  );
}
