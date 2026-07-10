import AssetSummary from "@/components/dashboard/AssetSummary";
import HoldingsPreview from "@/components/dashboard/HoldingsPreview";
import { holdings } from "@/lib/dummy-data";
import { getPortfolioSummary } from "@/lib/portfolio";

export default function DashboardPage() {
  const summary = getPortfolioSummary(holdings);

  return (
    <div className="flex flex-col">
      <AssetSummary summary={summary} />
      <HoldingsPreview holdings={holdings} />
    </div>
  );
}
