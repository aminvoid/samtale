/**
 * Azure Speech credentials for the audio scripts only (ADR-0006 §5, ADR-0010).
 * Never imported by `src/`. The key is validated but never printed: error messages
 * name the variable, not its value.
 */
import { z } from "zod";

const speechEnvSchema = z.object({
  AZURE_SPEECH_KEY: z
    .string({ error: "AZURE_SPEECH_KEY is not set" })
    .trim()
    .min(20, { error: "AZURE_SPEECH_KEY looks too short" })
    .refine((v) => !/^(<|your|changeme|x+$)/i.test(v), { error: "AZURE_SPEECH_KEY is still a placeholder" }),
  AZURE_SPEECH_REGION: z
    .string({ error: "AZURE_SPEECH_REGION is not set" })
    .trim()
    .regex(/^[a-z]+[a-z0-9]*$/, { error: "AZURE_SPEECH_REGION must be a region id such as swedencentral" }),
});

export interface SpeechEnv {
  key: string;
  region: string;
}

export function parseSpeechEnv(source: Record<string, string | undefined>): SpeechEnv {
  const result = speechEnvSchema.safeParse(source);
  if (!result.success) {
    // Issue messages only; Zod's default output could echo the input value.
    const messages = result.error.issues.map((i) => `- ${i.message}`).join("\n");
    throw new Error(`Azure Speech environment is not usable:\n${messages}`);
  }
  return { key: result.data.AZURE_SPEECH_KEY, region: result.data.AZURE_SPEECH_REGION };
}
