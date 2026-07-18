import { AllocationEntry } from "@/lib/services/portfolio-service";
import { formatKRW } from "@/lib/format";
import { ASSET_TYPE_LABEL } from "@/lib/models/asset-types";
import { AssetType } from "@/lib/models/asset";

// Categorical palette validated for light/dark surfaces and CVD separation
// in STOCK→BOND→CASH display order (see dataviz validator).
const CATEGORY_COLOR: Record<AssetType, string> = {
  STOCK: "#2a78d6",
  BOND: "#c98500",
  CASH: "#1baf7a",
};

export default function AllocationBreakdown({ allocation }: { allocation: AllocationEntry[] }) {
  if (allocation.length === 0) return null;

  return (
    <section className="h-full rounded-2xl bg-white p-6 shadow-sm dark:bg-card-dark">
      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">자산 구성</p>

      <div className="mt-4 flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full bg-gray-100 dark:bg-white/5">
        {allocation.map((entry) => (
          <div
            key={entry.type}
            style={{ width: `${entry.ratio}%`, backgroundColor: CATEGORY_COLOR[entry.type] }}
            className="h-full first:rounded-l-full last:rounded-r-full"
          />
        ))}
      </div>

      <ul className="mt-4 flex flex-col gap-2.5">
        {allocation.map((entry) => (
          <li key={entry.type} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: CATEGORY_COLOR[entry.type] }}
              />
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {ASSET_TYPE_LABEL[entry.type]}
              </span>
            </div>
            <div className="flex items-center gap-2 text-right">
              <span className="text-gray-400 dark:text-gray-500">{formatKRW(entry.valuation)}</span>
              <span className="w-12 font-semibold text-gray-900 dark:text-gray-100">
                {entry.ratio.toFixed(1)}%
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
