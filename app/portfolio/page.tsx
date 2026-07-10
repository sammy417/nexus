"use client";

import HoldingCard from "@/components/portfolio/HoldingCard";
import { usePortfolio } from "@/lib/portfolio-context";

export default function PortfolioPage() {
  const { holdings } = usePortfolio();

  return (
    <div className="flex flex-col gap-3">
      <p className="px-1 text-sm font-medium text-gray-400">
        보유 종목 {holdings.length}개
      </p>
      {holdings.length === 0 ? (
        <p className="py-24 text-center text-sm text-gray-400">보유 종목이 없습니다.</p>
      ) : (
        holdings.map((holding) => <HoldingCard key={holding.id} holding={holding} />)
      )}
    </div>
  );
}
