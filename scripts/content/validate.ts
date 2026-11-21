/** content:validate: validates content/ (ADR-0003). Exits 1 on any error. */
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { REPO_ROOT, loadSource, topicIdOf } from "./lib/source.ts";
import { parseAppendix, topicBlocks } from "./lib/topic-parser.ts";
import { validateContent } from "./lib/validate.ts";
import { ReviewLedgerSchema } from "./lib/pipeline-schema.ts";

const src = loadSource();
const mainIds = topicBlocks(src, "t-").map((block) => {
  const match = /^t-([MN])(\d\d)([ABC])$/.exec(block.anchor);
  const [, session, yy, letter] = match ?? [];
  if (session === undefined || yy === undefined || (letter !== "A" && letter !== "B" && letter !== "C")) {
    throw new Error(`Unexpected topic anchor: ${block.anchor}`);
  }
  return topicIdOf(2000 + Number(yy), session === "M" ? "maj" : "nov", letter);
});
const appendixIds = parseAppendix(src).topics.map((t) => topicIdOf(t.year, t.session, t.letter));
const knownSources = new Set(
  readdirSync(resolve(REPO_ROOT, "scripts/content/data"))
    .filter((f) => /^siri-.+\.json$/.test(f))
    .map((f) => f.replace(/\.json$/, "")),
);
const ledger = ReviewLedgerSchema.parse(JSON.parse(readFileSync(resolve(REPO_ROOT, "content/review-ledger.json"), "utf8")));

const result = validateContent(resolve(REPO_ROOT, "content"), {
  knownTopicIds: new Set([...mainIds, ...appendixIds]),
  mainTopicIds: new Set(mainIds),
  knownSources,
  ledger,
});
for (const line of result.report) process.stdout.write(`${line}\n`);
if (result.errors.length > 0) {
  process.stderr.write(`VALIDATION FAILED (${result.errors.length}):\n${result.errors.map((e) => `  ${e}`).join("\n")}\n`);
  process.exit(1);
}
process.stdout.write("content:validate OK\n");
