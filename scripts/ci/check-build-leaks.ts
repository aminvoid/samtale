/**
 * Fails if internal content appears in .next/, public/ or src/generated/. ADR-0002 §4.5.
 * Runs as `postbuild`, so every `npm run build` (CI, Vercel, local) is checked. The channel comes from
 * CONTENT_RELEASE: in production, unapproved topic IDs and text are canaries too.
 * Usage: tsx scripts/ci/check-build-leaks.ts
 */
import { resolve } from "node:path";
import { parseBuildEnv } from "../../src/lib/env/schema.ts";
import { assertReadModelChannel } from "./build-artifacts.ts";
import { collectCanaries, scanBuild } from "./leak-scan.ts";

const root = resolve(import.meta.dirname, "../..");
const channel = parseBuildEnv(process.env).CONTENT_RELEASE;
assertReadModelChannel(root, channel);

const canaries = collectCanaries({
  contentDir: resolve(root, "content"),
  messagesDir: resolve(root, "messages"),
  channel,
});
const sources = [...canaries.counts]
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([source, n]) => `  ${source}: ${String(n)}`)
  .join("\n");
process.stdout.write(`check:leaks [${channel}] canaries by source:\n${sources}\n`);

const { leaks, filesScanned } = scanBuild({ rootDir: root, canaries });
if (leaks.length > 0) {
  const lines = leaks.map((l) => `  ${l.file}: [${l.source}] ${l.canary.slice(0, 60)}`).join("\n");
  process.stderr.write(`INTERNAL CONTENT FOUND IN BUILD OUTPUT (${String(leaks.length)}):\n${lines}\n`);
  process.exit(1);
}
const total = String(
  canaries.windows.size + canaries.texts.size + canaries.tokens.size + canaries.years.size,
);
process.stdout.write(`check:leaks OK (${total} canaries, ${String(filesScanned)} files scanned)\n`);
