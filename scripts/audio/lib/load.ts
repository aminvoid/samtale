/** Reads and validates the content the audio scripts need. */
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { examConfig } from "../../../src/lib/exam/config.ts";
import { type ExaminerLines, examinerLinesSchema, type ExtraLine, type Topic, topicSchema } from "./items.ts";

const readJson = (path: string): unknown => JSON.parse(readFileSync(path, "utf8"));

export interface AudioContent {
  topics: Topic[];
  lines: ExaminerLines;
  extra: ExtraLine[];
}

export function loadContent(root: string): AudioContent {
  const dir = resolve(root, "content/topics");
  const topics = readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => topicSchema.parse(readJson(resolve(dir, f))));
  const lines = examinerLinesSchema.parse(readJson(resolve(root, "content/examiner-lines.json")));
  // The sound-check line now lives in content/examiner-lines.json (origin "app", content-engineer
  // 2026-11-21). Adding it here again would duplicate the ID. Keep only lines that content doesn't define yet.
  const extra = [{ id: examConfig.soundCheckClipId, text: examConfig.soundCheckText }].filter(
    (line) => !lines.lines.some((existing) => existing.id === line.id),
  );
  return { topics, lines, extra };
}
