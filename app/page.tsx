"use client";

import AssetSummary from "@/components/dashboard/AssetSummary";
import HoldingsPreview from "@/components/dashboard/HoldingsPreview";
import { usePortfolio } from "@/lib/portfolio-context";

export default function DashboardPage() {
  const { holdings, summary } = usePortfolio();

  return (
    <div className="flex flex-col">
      <AssetSummary summary={summary} />
      <HoldingsPreview holdings={holdings} />
    </div>
  );
}
