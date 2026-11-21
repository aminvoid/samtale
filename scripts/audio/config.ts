/**
 * Generation settings (ADR-0006, ADR-0015). Changing any value here changes clip hashes,
 * so affected clips are regenerated on the next run.
 */
import type { VoiceRole } from "./lib/items.ts";
import type { SsmlSettings } from "./lib/ssml.ts";

/** Bump when generator behaviour changes in a way that should regenerate every clip. */
export const GENERATOR_VERSION = "audio-gen/1";

/** ADR-0006: MP3, 24 kHz, 48 kbit/s, mono, constant bit rate. */
export const OUTPUT_FORMAT = "Audio24Khz48KBitRateMonoMp3";
/** 48 kbit/s CBR = 6 bytes per millisecond; the file length is what browsers report. */
export const BYTES_PER_MS = 6;

/**
 * PROPOSED in ADR-0015 (status Proposed, 2026-11-20), pending the owner's listening test.
 * The model voice must return word boundaries; on 2026-11-20 only the standard neural
 * da-DK voices did (ChristelNeural, JeppeNeural).
 */
export const VOICES: Record<VoiceRole, string> = {
  examiner: "da-DK-JeppeNeural",
  model: "da-DK-ChristelNeural",
};

export const SSML_SETTINGS: Record<VoiceRole, SsmlSettings> = {
  examiner: {},
  model: {},
};

export type PriceClass = "neural" | "neuralHd" | "mai" | "maiFlash";

export function priceClassOf(voice: string): PriceClass {
  if (voice.endsWith(":MAI-Voice-2.1-Flash")) return "maiFlash";
  if (voice.includes(":MAI-Voice")) return "mai";
  if (/:DragonHD/.test(voice)) return "neuralHd";
  return "neural";
}

/**
 * Pay-as-you-go (S0) prices in USD per 1 million billable characters.
 * Source: Azure Retail Prices API (prices.azure.com), armRegionName = swedencentral,
 * productName = "Azure Speech", checked 2026-11-20:
 *   "S1 Neural Text To Speech Characters" 15 (effective 2026-02-01)
 *   "Neural HD Text to Speech Characters" 22 (effective 2026-03-01)
 * MAI-Voice has its own row on the pricing page, but the Retail Prices API had no MAI-Voice meter
 * on 2026-11-20. The MAI figures are a third-party report (22 / 15) and are UNVERIFIED.
 * Free tier (F0): 0.5 million characters per month for neural voices; 20 transactions per 60 s.
 */
export const PRICING = {
  checkedOn: "2026-11-20",
  region: "swedencentral",
  currency: "USD",
  perMillion: { neural: 15, neuralHd: 22, mai: 22, maiFlash: 15 } satisfies Record<PriceClass, number>,
  unverified: new Set<PriceClass>(["mai", "maiFlash"]),
  f0FreeCharsPerMonth: 500_000,
  f0TransactionsPerMinute: 20,
} as const;
