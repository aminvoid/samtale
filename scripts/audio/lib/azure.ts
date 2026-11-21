/**
 * Azure AI Speech adapter (real-time synthesis over the Speech SDK, which streams
 * word-boundary events). Only `scripts/audio/**` may import the SDK (ADR-0001).
 * Never used in tests.
 */
import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import { z } from "zod";
import type { SpeechEnv } from "../env.ts";
import { redact } from "./redact.ts";
import type { BoundaryEvent } from "./words.ts";
import {
  PermanentSynthesisError,
  type SynthesisResult,
  type Synthesizer,
  TransientSynthesisError,
} from "./synthesizer.ts";

const TICKS_PER_MS = 10_000;

const KIND: Record<string, BoundaryEvent["kind"]> = {
  [sdk.SpeechSynthesisBoundaryType.Word]: "word",
  [sdk.SpeechSynthesisBoundaryType.Punctuation]: "punctuation",
  [sdk.SpeechSynthesisBoundaryType.Sentence]: "sentence",
};

const TRANSIENT = new Set([
  sdk.CancellationErrorCode.TooManyRequests,
  sdk.CancellationErrorCode.ConnectionFailure,
  sdk.CancellationErrorCode.ServiceTimeout,
  sdk.CancellationErrorCode.ServiceError,
]);

export function createAzureSynthesizer(env: SpeechEnv): Synthesizer {
  const config = sdk.SpeechConfig.fromSubscription(env.key, env.region);
  config.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio24Khz48KBitRateMonoMp3;
  // Report punctuation and sentence boundaries too; the generator keeps only words.
  config.setProperty(sdk.PropertyId.SpeechServiceResponse_RequestWordBoundary, "true");
  config.setProperty(sdk.PropertyId.SpeechServiceResponse_RequestPunctuationBoundary, "true");

  return {
    synthesize(ssml) {
      return new Promise<SynthesisResult>((resolve, reject) => {
        // One synthesizer per request: boundary events can't mix between concurrent clips.
        const synthesizer = new sdk.SpeechSynthesizer(config, null);
        const boundaries: BoundaryEvent[] = [];
        synthesizer.wordBoundary = (_s, e) => {
          boundaries.push({
            kind: KIND[e.boundaryType] ?? "word",
            text: e.text,
            textOffset: e.textOffset,
            wordLength: e.wordLength,
            audioOffsetMs: e.audioOffset / TICKS_PER_MS,
            durationMs: e.duration / TICKS_PER_MS,
          });
        };
        const done = () => {
          synthesizer.close();
        };
        synthesizer.speakSsmlAsync(
          ssml,
          (result) => {
            done();
            if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
              resolve({
                audio: new Uint8Array(result.audioData),
                durationMs: Math.round(result.audioDuration / TICKS_PER_MS),
                boundaries,
              });
              return;
            }
            const details = sdk.CancellationDetails.fromResult(result);
            const message = redact(
              `Synthesis cancelled: ${sdk.CancellationErrorCode[details.ErrorCode]} ${details.errorDetails}`.trim(),
              env.key,
            );
            reject(
              TRANSIENT.has(details.ErrorCode)
                ? new TransientSynthesisError(message)
                : new PermanentSynthesisError(message),
            );
          },
          (error) => {
            done();
            reject(new TransientSynthesisError(redact(`Synthesis failed: ${error}`, env.key)));
          },
        );
      });
    },
    close() {
      config.close();
    },
  };
}

const voiceListSchema = z.array(
  z.object({
    ShortName: z.string(),
    Locale: z.string(),
    Gender: z.string(),
    VoiceType: z.string(),
    Status: z.string().optional(),
    StyleList: z.array(z.string()).optional(),
    SecondaryLocaleList: z.array(z.string()).optional(),
    WordsPerMinute: z.string().optional(),
    SampleRateHertz: z.string().optional(),
    VoiceTag: z.record(z.string(), z.array(z.string())).optional(),
  }),
);

export type AzureVoice = z.infer<typeof voiceListSchema>[number];

/** GET the voice list for the resource's region (free; no characters billed). */
export async function fetchVoices(env: SpeechEnv): Promise<AzureVoice[]> {
  const res = await fetch(`https://${env.region}.tts.speech.microsoft.com/cognitiveservices/voices/list`, {
    headers: { "Ocp-Apim-Subscription-Key": env.key },
  });
  if (!res.ok) throw new Error(`Voice list request failed with HTTP ${String(res.status)}`);
  return voiceListSchema.parse(await res.json());
}
