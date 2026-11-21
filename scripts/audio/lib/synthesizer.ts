/** The port the generator depends on. Tests use a fake; `azure.ts` is the real adapter. */
import type { BoundaryEvent } from "./words.ts";

export interface SynthesisResult {
  audio: Uint8Array;
  durationMs: number;
  boundaries: BoundaryEvent[];
}

export interface Synthesizer {
  synthesize(ssml: string): Promise<SynthesisResult>;
  close(): void;
}

/** A failure the generator may retry (throttling, 5xx, network). */
export class TransientSynthesisError extends Error {
  override name = "TransientSynthesisError";
}

/** A failure retrying won't fix (bad SSML, unknown voice, auth). */
export class PermanentSynthesisError extends Error {
  override name = "PermanentSynthesisError";
}
