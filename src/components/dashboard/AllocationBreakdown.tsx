"use client";

import DonutBreakdownCard from "@/components/common/DonutBreakdownCard";
import { CategoryAllocationEntry } from "@/lib/services/portfolio-service";
import {
  PORTFOLIO_CATEGORY_COLOR,
  PORTFOLIO_CATEGORY_LABEL,
} from "@/lib/models/portfolio-category";

export default function AllocationBreakdown({
  allocation,
}: {
  allocation: CategoryAllocationEntry[];
}) {
  return (
    <DonutBreakdownCard
      title="자산 구성"
      ariaLabel="자산 카테고리별 구성 비중 도넛 차트"
      entries={allocation.map((entry) => ({
        id: entry.category,
        label: PORTFOLIO_CATEGORY_LABEL[entry.category],
        color: PORTFOLIO_CATEGORY_COLOR[entry.category],
        valuation: entry.valuation,
        ratio: entry.ratio,
      }))}
    />
  );
}
