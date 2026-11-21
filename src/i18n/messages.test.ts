import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { buildFormats } from "./formats";

// Not `new URL(..., import.meta.url)`: Vite rewrites that pattern to an http: asset URL under jsdom.
const DIR = resolve(import.meta.dirname, "../../messages");
const files = readdirSync(DIR).filter((f) => /^[a-z]{2,3}(-[A-Z]{2})?\.json$/.test(f));

function flatten(value: unknown, prefix = "", out = new Map<string, string>()): Map<string, string> {
  if (typeof value === "string") out.set(prefix, value);
  else if (value !== null && typeof value === "object") {
    for (const [key, child] of Object.entries(value))
      flatten(child, prefix === "" ? key : `${prefix}.${key}`, out);
  }
  return out;
}
const load = (file: string) => flatten(JSON.parse(readFileSync(resolve(DIR, file), "utf8")));
const argsOf = (message: string) =>
  [...message.matchAll(/\{\s*([A-Za-z_]\w*)\s*[,}]/g)]
    .map((m) => m[1])
    .sort()
    .join(",");

const fa = load("fa.json");
const PLAIN_TEXT_KEYS = /^metadata\./;

/** The message text a reader sees, minus <da>/<ltr> runs and ICU syntax (argument names, plural keys). */
function textOutsideTags(message: string): string {
  return message
    .replace(/<(da|ltr)>[\s\S]*?<\/\1>/g, "")
    .replace(/<\/?[a-zA-Z][a-zA-Z0-9]*>/g, "")
    .replace(/\{\s*[A-Za-z_]\w*\s*(,\s*[A-Za-z]+\s*)?(,\s*[A-Za-z]+\s*)?/g, "{")
    .replace(/(?:\b(?:zero|one|two|few|many|other)|=\d+)\s*\{/g, "{");
}

function hasLatinOutsideTags(message: string): boolean {
  return /[A-Za-z]/.test(textOutsideTags(message));
}

/** Literal digits bypass the digit-style setting; numbers come in as {n, number, integer} (i18n rule). */
function hasDigitsOutsideTags(message: string): boolean {
  return /[0-9\u0660-\u0669\u06F0-\u06F9]/.test(textOutsideTags(message));
}

// Only named formats carry the digit and calendar knobs (ADR-0004 §5): `{n, number}`, `{d, date, short}`
// or `{n, number, ::compact-short}` would bypass NUMBERING_SYSTEM_OVERRIDES and CALENDAR.
const FORMATS = buildFormats("fa");
const NAMED_FORMATS = {
  number: new Set(Object.keys(FORMATS.number)),
  date: new Set(Object.keys(FORMATS.dateTime)),
  time: new Set(Object.keys(FORMATS.dateTime)),
};

function unnamedFormats(message: string): string[] {
  const problems: string[] = [];
  for (const m of message.matchAll(/\{\s*[A-Za-z_]\w*\s*,\s*(number|date|time)\s*(?:,\s*([^{}]*?))?\s*\}/g)) {
    const [whole, type, style] = m;
    if (type !== "number" && type !== "date" && type !== "time") continue;
    if (style === undefined || !NAMED_FORMATS[type].has(style.trim())) problems.push(whole);
  }
  return problems;
}

describe("messages", () => {
  it.each(files)("%s has exactly the keys and ICU arguments of fa.json", (file) => {
    const other = load(file);
    expect([...other.keys()].sort()).toEqual([...fa.keys()].sort());
    for (const [key, message] of fa) expect(argsOf(other.get(key) ?? ""), key).toBe(argsOf(message));
  });

  it("fa: numbers use named formats, never a bare # (ADR-0004 §5)", () => {
    for (const [key, message] of fa) expect(message.includes("#"), key).toBe(false);
  });

  it("the named-format check catches unnamed and inline formats", () => {
    expect(unnamedFormats("{count, number, integer} {year, number, year} {d, date, date}")).toEqual([]);
    expect(
      unnamedFormats("{n, number} {n, number, ::compact-short} {d, date, short} {d, date} {t, time}"),
    ).toEqual(["{n, number}", "{n, number, ::compact-short}", "{d, date, short}", "{d, date}", "{t, time}"]);
  });

  it.each(files)("%s: numbers, dates and times use named formats only (ADR-0004 §5)", (file) => {
    for (const [key, message] of load(file)) expect(unnamedFormats(message), key).toEqual([]);
  });

  it("fa: Latin text appears only inside <da> or <ltr> tags (ADR-0004 §3)", () => {
    for (const [key, message] of fa) {
      if (!PLAIN_TEXT_KEYS.test(key)) expect(hasLatinOutsideTags(message), key).toBe(false);
    }
  });

  it("the digit check catches Latin, Persian and Arabic-Indic digits, but not ICU syntax or tagged runs", () => {
    expect(hasDigitsOutsideTags("{count, number, integer} موضوع")).toBe(false);
    expect(hasDigitsOutsideTags("{n, plural, =0 {هیچ} other {{n, number, integer}}}")).toBe(false);
    expect(hasDigitsOutsideTags("آزمون <ltr>PD3</ltr>")).toBe(false);
    expect(hasDigitsOutsideTags("51 موضوع")).toBe(true);
    expect(hasDigitsOutsideTags("۵۱ موضوع")).toBe(true);
    expect(hasDigitsOutsideTags("٥١ موضوع")).toBe(true);
  });

  it.each(files)("%s: no literal digits outside tags (i18n rule)", (file) => {
    // metadata.* is plain text (no tags), where digits belong to names such as PD3 and delprøve 2.
    for (const [key, message] of load(file)) {
      if (!PLAIN_TEXT_KEYS.test(key)) expect(hasDigitsOutsideTags(message), key).toBe(false);
    }
  });

  it("fa: the exam is «آزمون», never «امتحان», not even for “try” (docs/content/glossary.md)", () => {
    for (const [key, message] of fa) expect(message.includes("امتحان"), key).toBe(false);
  });

  it("fa: Persian letters only (no Arabic ي/ك, no presentation forms)", () => {
    for (const [key, message] of fa)
      expect(/[\u064A\u0643\uFB50-\uFDFF\uFE70-\uFEFF]/.test(message), key).toBe(false);
  });
});
