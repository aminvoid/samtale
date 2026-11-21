import { lstatSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { BuildEnv } from "../../src/lib/env/schema.ts";

export const READ_MODEL_PATH = "src/generated/content/read-model.json";

export function requireArtifact(rootDir: string, path: string): string {
  const file = join(rootDir, path);
  const stat = lstatSync(file, { throwIfNoEntry: false });
  if (stat?.isFile() !== true || stat.size === 0) {
    throw new Error(`Missing or empty build artifact ${path}. Run \`npm run build\` first.`);
  }
  return file;
}

export type Channel = BuildEnv["CONTENT_RELEASE"];

export function assertReadModelChannel(rootDir: string, expected: Channel): void {
  const file = requireArtifact(rootDir, READ_MODEL_PATH);
  const model: unknown = JSON.parse(readFileSync(file, "utf8"));
  if (typeof model !== "object" || model === null || !("channel" in model) || model.channel !== expected) {
    throw new Error(
      `Generated read model channel does not match CONTENT_RELEASE=${expected}. Run \`npm run content:build\` with the intended channel.`,
    );
  }
}
