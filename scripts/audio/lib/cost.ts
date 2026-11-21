/** Cost and time estimate for a plan, from the pricing table in config.ts. */
import { PRICING, type PriceClass, priceClassOf } from "../config.ts";

export interface CostLine {
  priceClass: PriceClass;
  chars: number;
  usd: number;
  verified: boolean;
}

export interface CostEstimate {
  lines: CostLine[];
  chars: number;
  requests: number;
  /** Pay-as-you-go (S0) cost. */
  s0Usd: number;
  /** Characters the F0 free allowance would not cover (0 means free on F0). */
  f0CharsOverAllowance: number;
  /** Minimum wall-clock minutes on F0 at its transaction limit. */
  f0Minutes: number;
}

export function estimateCost(clips: ReadonlyArray<{ voice: string; billableChars: number }>): CostEstimate {
  const byClass = new Map<PriceClass, number>();
  for (const c of clips) byClass.set(priceClassOf(c.voice), (byClass.get(priceClassOf(c.voice)) ?? 0) + c.billableChars);
  const lines: CostLine[] = [...byClass].map(([priceClass, chars]) => ({
    priceClass,
    chars,
    usd: (chars / 1_000_000) * PRICING.perMillion[priceClass],
    verified: !PRICING.unverified.has(priceClass),
  }));
  const chars = lines.reduce((n, l) => n + l.chars, 0);
  return {
    lines,
    chars,
    requests: clips.length,
    s0Usd: lines.reduce((n, l) => n + l.usd, 0),
    f0CharsOverAllowance: Math.max(0, chars - PRICING.f0FreeCharsPerMonth),
    f0Minutes: Math.ceil(clips.length / PRICING.f0TransactionsPerMinute),
  };
}

export const formatUsd = (usd: number) => `$${usd < 0.01 && usd > 0 ? usd.toFixed(4) : usd.toFixed(2)}`;
