"use client";

import DonutBreakdownCard from "@/components/common/DonutBreakdownCard";
import { OwnerAllocationEntry } from "@/lib/services/portfolio-service";
import { ASSET_OWNER_LABEL } from "@/lib/models/asset-owner";
import { AssetOwner } from "@/lib/models/asset";

// Matches the owner badge hues; validated as a 3-slot palette for both surfaces.
const OWNER_COLOR: Record<AssetOwner, string> = {
  SELF: "#3182F6",
  SPOUSE: "#c9548a",
  JOINT: "#c98500",
};

export default function OwnerBreakdown({
  allocation,
}: {
  allocation: OwnerAllocationEntry[];
}) {
  return (
    <DonutBreakdownCard
      title="소유자별 구성"
      subtitle="전체(합산) 자산 기준"
      ariaLabel="소유자별 자산 구성 비중 도넛 차트"
      entries={allocation.map((entry) => ({
        id: entry.owner,
        label: ASSET_OWNER_LABEL[entry.owner],
        color: OWNER_COLOR[entry.owner],
        valuation: entry.valuation,
        ratio: entry.ratio,
      }))}
    />
  );
}
