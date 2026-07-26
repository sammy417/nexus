"use client";

import { formatPercent } from "@/lib/format";
import { useDisplayCurrency } from "@/lib/currency-context";
import AnimatedNumber from "@/components/common/AnimatedNumber";

interface Tile {
  label: string;
  /** Percent value; null renders as "-" (not enough history). */
  rate: number | null;
  /** Optional KRW amount shown under the rate. */
  amountKrw?: number;
  /** How to color the rate: by sign (default) or always neutral. */
  tone?: "signed" | "neutral";
}

function rateClass(rate: number | null, tone: Tile["tone"]): string {
  if (rate === null || tone === "neutral" || rate === 0)
    return "text-gray-900 dark:text-gray-100";
  return rate > 0 ? "text-rise" : "text-fall";
}

export default function StatTiles({ tiles }: { tiles: Tile[] }) {
  const { signedMoney } = useDisplayCurrency();

  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      {tiles.map((tile) => (
        <div key={tile.label} className="rounded-2xl bg-white p-5 shadow-sm dark:bg-card-dark">
          <p className="text-xs font-medium text-gray-400 dark:text-gray-500">{tile.label}</p>
          <p className={`mt-1.5 text-2xl font-bold tracking-tight ${rateClass(tile.rate, tile.tone)}`}>
            {tile.rate === null ? "-" : <AnimatedNumber value={tile.rate} format={formatPercent} />}
          </p>
          {tile.amountKrw !== undefined && (
            <p className="mt-0.5 text-xs font-medium text-gray-400 dark:text-gray-500">
              <AnimatedNumber value={tile.amountKrw} format={signedMoney} />
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
