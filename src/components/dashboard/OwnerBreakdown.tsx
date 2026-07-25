"use client";

import DonutBreakdownCard from "@/components/common/DonutBreakdownCard";
import { OwnerAllocationEntry } from "@/lib/services/portfolio-service";
import { OWNER_COLOR } from "@/lib/models/asset-owner";
import { useSettings } from "@/lib/settings-context";

export default function OwnerBreakdown({
  allocation,
}: {
  allocation: OwnerAllocationEntry[];
}) {
  const { ownerName } = useSettings();

  return (
    <DonutBreakdownCard
      title="소유자별 구성"
      subtitle="전체(합산) 자산 기준"
      ariaLabel="소유자별 자산 구성 비중 도넛 차트"
      entries={allocation.map((entry) => ({
        id: entry.owner,
        label: ownerName(entry.owner),
        color: OWNER_COLOR[entry.owner],
        valuation: entry.valuation,
        ratio: entry.ratio,
      }))}
    />
  );
}
