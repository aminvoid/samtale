import { createHash } from "node:crypto";

type Json = string | number | boolean | null | Json[] | { [key: string]: Json | undefined };

/** JSON with object keys sorted at every level and `undefined` members dropped. */
export function canonicalJson(value: Json): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  const members = Object.entries(value)
    .filter((e): e is [string, Json] => e[1] !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${members.map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`).join(",")}}`;
}

export const sha256 = (s: string) => createHash("sha256").update(s, "utf8").digest("hex");

export interface ClipHashInput {
  ssml: string;
  voice: string;
  outputFormat: string;
  ssmlSettings: { rate?: string; sentencePauseMs?: number };
  lexiconVersion: string;
  generatorVersion: string;
}

/** ADR-0006 §1: first 20 hex characters of SHA-256 over the canonical JSON of the inputs. */
export function clipHash(input: ClipHashInput): string {
  return sha256(canonicalJson({ ...input })).slice(0, 20);
}
