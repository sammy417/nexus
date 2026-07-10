import HoldingCard from "@/components/portfolio/HoldingCard";
import { holdings } from "@/lib/dummy-data";

export default function PortfolioPage() {
  return (
    <div className="flex flex-col gap-3">
      <p className="px-1 text-sm font-medium text-gray-400">
        보유 종목 {holdings.length}개
      </p>
      {holdings.map((holding) => (
        <HoldingCard key={holding.id} holding={holding} />
      ))}
    </div>
  );
}
