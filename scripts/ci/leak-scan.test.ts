// @vitest-environment node
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { collectCanaries, decodeHtml, decodeJsonEscapes, normalise, scanBuild, textViews } from "./leak-scan";
import { READ_MODEL_PATH, type Channel } from "./build-artifacts";

// Fixture text. NOTE contains a quote, an ampersand and a line break, which the build escapes.
const NOTE =
  "همین موضوع در Skriftlig 2026 هم آمد؛ it's an internal note & it must never ship.\nSecond line of the note.";
/** Matched whole, so each encoding test passes only if the scan decodes it. */
const SHORT_NOTE = `it's «نکته» & "x"!`;
const ONE_LETTER_NOTE = "ژ";
const SHORT_CORRECTION = "ombyt";
const UNAPPROVED_TITLE = "Kår";
const SPOKEN_BASIS = "Unpublished rationale for the recorded wording";
const LEDGER =
  "Situation titles are the booklet's short descriptions ('sygeplejerske med mange patienter'). Decide later.";
const PUBLIC_NOTE = "Approved tip: this text is public on purpose and may appear in the build.";
const PUBLISHED_TITLE = "sygeplejerske med mange patienter";
const APPROVED_QUESTION = "Hvorfor tror du, at mange vælger at arbejde i sundhedssektoren?";
const UNAPPROVED_QUESTION = "Hvad synes du om at bygge flere boliger i de store byer i Danmark i dag?";

let root: string;

function write(path: string, content: unknown): void {
  const full = join(root, path);
  mkdirSync(dirname(full), { recursive: true });
  const data =
    typeof content === "string" || Buffer.isBuffer(content) ? content : JSON.stringify(content, null, 2);
  writeFileSync(full, data);
}

function topic(id: string, status: string, question: string) {
  const section = {
    question: {
      text: { da: question, fa: "پرسش" },
      keywords: [],
      modelAnswer: { text: { da: "Et svar" }, spoken: { basis: SPOKEN_BASIS } },
    },
    followups: [],
    personalExamples: [],
  };
  return {
    schemaVersion: 0,
    id,
    title: { da: status === "approved" ? `Emne ${id}` : UNAPPROVED_TITLE, fa: "موضوع" },
    situations: [{ title: { da: PUBLISHED_TITLE, fa: "عنوان" }, ...section }],
    general: section,
    review: { status },
  };
}

function marginNote(
  index: number,
  text: string,
  visibility = "internal",
  confidentialityHits: string[] = [],
) {
  return {
    id: `2024-maj-a.note${String(index)}`,
    topicId: "2024-maj-a",
    kind: "tip",
    text: { fa: text },
    refs: [],
    confidentialityHits,
    visibility,
    source: { pages: [1] },
    review: { status: visibility === "public" ? "approved" : "extracted" },
  };
}

function writeContent(): void {
  write("content/internal/margin-notes.json", {
    schemaVersion: 0,
    notes: [
      marginNote(1, NOTE, "internal", ["2026", "Skriftlig 2026"]),
      marginNote(2, PUBLIC_NOTE, "public"),
      marginNote(3, SHORT_NOTE),
      marginNote(4, ONE_LETTER_NOTE),
      marginNote(5, SPOKEN_BASIS),
      marginNote(6, "..."),
    ],
  });
  write("content/review-ledger.json", {
    schemaVersion: 0,
    topics: {
      "2024-maj-a": {
        status: "approved",
        notes: [{ text: LEDGER }],
        corrections: [
          {
            id: "fixture",
            path: "general.question.text.da",
            kind: "naturalness",
            find: "Hvorfor",
            suggestion: SHORT_CORRECTION,
            reason: "omskriv",
            by: "test",
            source: "test",
            status: "proposed",
          },
        ],
      },
    },
  });
  write("content/topics/2024-maj-a.json", topic("2024-maj-a", "approved", APPROVED_QUESTION));
  write("content/topics/2024-maj-b.json", topic("2024-maj-b", "extracted", UNAPPROVED_QUESTION));
  write("content/themes.json", { themes: [{ title: { da: "Arbejde", fa: "کار" }, subthemes: [] }] });
  write("messages/fa.json", { home: { title: "خانه" } });
}

function canaries(channel: Channel) {
  return collectCanaries({ contentDir: join(root, "content"), messagesDir: join(root, "messages"), channel });
}

function scan(channel: Channel) {
  return scanBuild({ rootDir: root, canaries: canaries(channel) }).leaks;
}

function htmlEscape(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "leak-scan-"));
  writeContent();
  write(".next/BUILD_ID", "fixture");
  write(".next/build-manifest.json", {});
  write(".next/server/app-paths-manifest.json", {});
  write(READ_MODEL_PATH, { channel: "preview" });
  write(".next/server/app/fa.html", "<html><body><h1>خانه</h1></body></html>");
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe("decoders", () => {
  it("decodes JSON escapes, including double-encoded text", () => {
    const twice = JSON.stringify(JSON.stringify(NOTE));
    expect(decodeJsonEscapes(decodeJsonEscapes(twice))).toContain(NOTE);
    expect(decodeJsonEscapes(String.raw`مو`)).toBe("مو");
    expect(decodeJsonEscapes(String.raw`\xE6\x20\u0645`)).toBe("æ م");
  });

  it("decodes HTML entities and drops comments and tags", () => {
    expect(decodeHtml("it&#x27;s <b>a</b><!-- -->&amp;b &quot;c&quot; &#1605;")).toBe(`it's a&b "c" م`);
  });

  it("normalises whitespace and Unicode", () => {
    expect(normalise("  a\n\t b ")).toBe("a b");
    expect(textViews("x").length).toBeGreaterThan(0);
  });
});

describe("collectCanaries", () => {
  it("collects internal notes and the ledger and keeps bare years as contextual canaries", () => {
    const c = canaries("preview");
    const windows = [...c.windows.keys()].join("\n");
    expect(windows).toContain(normalise(NOTE).slice(0, 24));
    expect(windows).not.toContain("Approved tip");
    expect(c.texts.has(ONE_LETTER_NOTE)).toBe(true);
    expect(c.texts.has("...")).toBe(false);
    expect(c.tokens.has("Skriftlig 2026")).toBe(true);
    expect([...c.years.keys()]).toEqual(["2026"]);
    expect(c.tokens.has("2024-maj-b")).toBe(false);
  });

  it("drops canaries that quote text the channel publishes", () => {
    const windows = [...canaries("preview").windows.keys()];
    expect(windows.some((w) => PUBLISHED_TITLE.includes(w))).toBe(false);
    expect(windows.some((w) => normalise(LEDGER).startsWith(w))).toBe(true);
  });

  it("keeps an internal note repeated only in spoken.basis as a canary", () => {
    for (const channel of ["preview", "production"] satisfies Channel[]) {
      expect(canaries(channel).windows.get(SPOKEN_BASIS.slice(0, 24))).toBe("internal:margin-notes.json");
    }
  });

  it("adds the IDs and text of unapproved topics in the production channel only", () => {
    const c = canaries("production");
    expect(c.tokens.get("2024-maj-b")).toBe("unapproved:2024-maj-b");
    expect(c.tokens.has("2024-maj-a")).toBe(false);
    const windows = [...c.windows.keys()];
    expect(windows).toContain(UNAPPROVED_QUESTION.slice(0, 24));
    // Text shared with an approved topic stays publishable.
    expect(windows.some((w) => PUBLISHED_TITLE.includes(w))).toBe(false);
  });

  it("fails closed when a source is missing or unreadable", () => {
    rmSync(join(root, "content/review-ledger.json"));
    expect(() => canaries("preview")).toThrow(/review-ledger/);
    writeContent();
    rmSync(join(root, "content/internal"), { recursive: true });
    expect(() => canaries("preview")).toThrow(/internal/);
    writeContent();
    write("content/topics/2024-maj-c.json", { id: "2024-maj-c", reviewStatus: "approved" });
    expect(() => canaries("preview")).toThrow(/2024-maj-c/);
  });

  it("canaries every internal file, recursively", () => {
    write("content/internal/drafts/links.json", {
      schemaVersion: 0,
      notes: [marginNote(7, "An internal draft link note that must not ship.")],
    });
    expect([...canaries("preview").counts.keys()]).toContain("internal:drafts/links.json");
  });

  it("rejects an unknown margin note visibility", () => {
    write("content/internal/typo.json", { schemaVersion: 0, notes: [marginNote(7, "private", "Internal")] });
    expect(() => canaries("preview")).toThrow(/internal:typo\.json[\s\S]*visibility/);
  });

  it("rejects nested internal records under an otherwise valid public note", () => {
    const note = { ...marginNote(7, PUBLIC_NOTE, "public"), children: [marginNote(8, "private")] };
    write("content/internal/nested.json", { schemaVersion: 0, notes: [note] });
    expect(() => canaries("preview")).toThrow(/internal:nested\.json[\s\S]*children/);
  });

  it("keeps review notes under a valid public margin note confidential", () => {
    const note = {
      ...marginNote(7, PUBLIC_NOTE, "public"),
      review: { status: "approved", notes: [{ text: "Privat" }] },
    };
    write("content/internal/public.json", { schemaVersion: 0, notes: [note] });
    expect(canaries("preview").texts.get("Privat")).toBe("internal:public.json");
  });

  it.each([
    { ...marginNote(7, PUBLIC_NOTE, "public"), review: { status: "reviewed" } },
    marginNote(7, "آزمون کتبی ۲۰۲۶", "public"),
  ])("rejects public margin notes that fail the approval or confidentiality gate", (note) => {
    write("content/internal/public.json", { schemaVersion: 0, notes: [note] });
    expect(() => canaries("preview")).toThrow(/Invalid public margin note/);
  });
});

describe("scanBuild", () => {
  it("passes a clean build", () => {
    expect(scan("preview")).toEqual([]);
    expect(scan("production")).toEqual([]);
  });

  const uEscape = (text: string) =>
    text.replace(/[^\x20-\x7e]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`);
  const xEscape = (text: string) =>
    text.replace(/^./, (c) => `\\x${c.charCodeAt(0).toString(16).padStart(2, "0")}`);

  it.each([
    ["raw", SHORT_NOTE],
    ["JSON-escaped", JSON.stringify({ note: SHORT_NOTE })],
    [
      "double JSON-escaped (flight data)",
      `self.__next_f.push([1,${JSON.stringify(JSON.stringify(SHORT_NOTE))}])`,
    ],
    ["\\u-escaped", uEscape(JSON.stringify(SHORT_NOTE))],
    ["\\x-escaped", xEscape(SHORT_NOTE)],
    ["HTML-escaped", `<p>${htmlEscape(SHORT_NOTE)}</p>`],
    [
      "HTML-escaped and split by React",
      `<p>${htmlEscape(SHORT_NOTE.slice(0, 9))}<!-- -->${htmlEscape(SHORT_NOTE.slice(9))}</p>`,
    ],
    ["re-wrapped", SHORT_NOTE.replace(/ /g, "\n  ")],
  ])("finds a whole internal string in the output: %s", (_label, text) => {
    write(".next/static/chunks/page.js", text);
    expect(scan("preview").map((l) => l.canary)).toContain(SHORT_NOTE);
  });

  it.each([
    ["an excerpt", `<p>${NOTE.slice(10, 60)}</p>`],
    ["an HTML-escaped excerpt", `<p>${htmlEscape(NOTE.slice(30, 90))}</p>`],
  ])("finds part of a long internal note: %s", (_label, text) => {
    write(".next/static/chunks/page.js", text);
    expect(scan("preview").map((l) => l.source)).toContain("internal:margin-notes.json");
  });

  it("finds a ledger note and a confidentiality hit", () => {
    write(".next/server/app/fa.rsc", `{"x":${JSON.stringify(LEDGER.slice(0, 50))},"y":"Skriftlig 2026"}`);
    const sources = scan("preview").map((l) => l.source);
    expect(sources).toContain("review-ledger");
    expect(sources).toContain("internal:margin-notes.json (confidentiality)");
  });

  it.each([
    ["exam 2026", "2026"],
    ["۲۰۲۶، آزمون کتبی", "2026"],
    ["prøven i 2026", "2026"],
  ])("finds a bare year in a different exam reference: %s", (reference, year) => {
    write(".next/server/app/fa.rsc", reference);
    expect(scan("preview").map(({ canary }) => canary)).toContain(year);
  });

  it("allows bare years in ordinary strings, ISO dates and hashes", () => {
    write(".next/server/app/fa.rsc", '["2026","2026-11-20","hash-e2026c","date 2026","۲۰۲۶"]');
    expect(scan("preview")).toEqual([]);
  });

  it.each([
    [ONE_LETTER_NOTE, "internal:margin-notes.json"],
    [SHORT_CORRECTION, "review-ledger"],
  ])("finds short sensitive values at word boundaries: %s", (value, source) => {
    write(".next/server/app/fa.rsc", `<p>${value}!</p>`);
    expect(scan("preview")).toContainEqual({ file: ".next/server/app/fa.rsc", source, canary: value });
    write(".next/server/app/fa.rsc", `<p>پ${value}س</p>`);
    expect(scan("preview")).toEqual([]);
  });

  it("finds a short unapproved title only in production", () => {
    write(".next/server/app/fa.rsc", `<b>${UNAPPROVED_TITLE}</b>`);
    expect(scan("production").map(({ canary }) => canary)).toContain(UNAPPROVED_TITLE);
    expect(scan("preview")).toEqual([]);
  });

  it("scans public/ and files of any extension", () => {
    write("public/audio/manifest.webmanifest", NOTE);
    expect(scan("preview").map((l) => l.file)).toContain("public/audio/manifest.webmanifest");
  });

  it("skips .next/cache, .next/dev and binary files", () => {
    write(".next/cache/fetch.json", NOTE);
    write(".next/dev/server/page.js", NOTE);
    write(".next/static/font.woff2", Buffer.concat([Buffer.from([0, 1, 2]), Buffer.from(NOTE)]));
    expect(scan("preview")).toEqual([]);
  });

  it("scans known text extensions when their contents include NUL bytes", () => {
    write(".next/static/page.js", `\0${SHORT_NOTE}`);
    expect(scan("preview").map((l) => l.file)).toContain(".next/static/page.js");
  });

  it("finds leaks that exist only in the generated read model and its siblings", () => {
    write(READ_MODEL_PATH, { channel: "preview", topics: [{ title: SPOKEN_BASIS }] });
    write("src/generated/other.txt", SHORT_CORRECTION);
    expect(scan("preview").map(({ file }) => file)).toEqual([READ_MODEL_PATH, "src/generated/other.txt"]);
  });

  it("finds unapproved topic IDs and text in production, with identifier boundaries", () => {
    write(".next/server/app/fa/topics/2024-maj-b.html", "<p>ok</p>");
    let files = scan("production").map((l) => l.file);
    expect(files).toContain(".next/server/app/fa/topics/2024-maj-b.html");

    rmSync(join(root, ".next/server/app/fa/topics"), { recursive: true });
    write(".next/server/app/fa.rsc", String.raw`["$","a",null,{"href":"/fa/topics/2024-maj-b.sitA"}]`);
    write(".next/static/chunks/q.js", JSON.stringify({ q: UNAPPROVED_QUESTION }));
    files = scan("production").map((l) => l.file);
    expect(files).toContain(".next/server/app/fa.rsc");
    expect(files).toContain(".next/static/chunks/q.js");
    // Preview publishes every topic.
    expect(scan("preview")).toEqual([]);
  });

  it("doesn't match an ID inside a longer identifier", () => {
    write(".next/server/app/fa.rsc", "2024-maj-bx x2024-maj-b");
    expect(scan("production")).toEqual([]);
  });

  it("matches the quoted review status and internal keys", () => {
    write(".next/server/app/fa.rsc", String.raw`{\"status\":\"needs-review\",\"siriParts\":[]}`);
    const canariesFound = scan("preview").map((l) => l.canary);
    expect(canariesFound).toContain('"needs-review"');
    expect(canariesFound).toContain("siriParts");
  });

  it("fails without build output", () => {
    rmSync(join(root, ".next"), { recursive: true });
    expect(() => scan("preview")).toThrow(/npm run build/);
  });

  it("fails with an empty build directory even when generated files exist", () => {
    rmSync(join(root, ".next"), { recursive: true });
    mkdirSync(join(root, ".next"));
    expect(() => scan("preview")).toThrow(/\.next\/BUILD_ID/);
  });

  it("fails when the generated read model is missing", () => {
    rmSync(join(root, READ_MODEL_PATH));
    expect(() => scan("preview")).toThrow(/src\/generated\/content\/read-model\.json/);
  });
});
