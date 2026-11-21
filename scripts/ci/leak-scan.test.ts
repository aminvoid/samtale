// @vitest-environment node
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  collectCanaries,
  decodeHtml,
  decodeJsonEscapes,
  normalise,
  scanBuild,
  textViews,
  type Channel,
} from "./leak-scan";

// Fixture text. NOTE contains a quote, an ampersand and a line break, which the build escapes.
const NOTE =
  "همین موضوع در Skriftlig 2026 هم آمد؛ it's an internal note & it must never ship.\nSecond line of the note.";
/** 16–23 characters: matched whole, so each encoding test passes only if the scan decodes it. */
const SHORT_NOTE = `it's «نکته» & "x"!`;
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
  return {
    schemaVersion: 0,
    id,
    title: { da: `Emne ${id}`, fa: "موضوع" },
    situations: [{ title: { da: PUBLISHED_TITLE }, questions: [{ text: { da: question } }] }],
    review: { status },
  };
}

function writeContent(): void {
  write("content/internal/margin-notes.json", {
    notes: [
      {
        id: "a.note1",
        text: { fa: NOTE },
        confidentialityHits: ["2026", "Skriftlig 2026"],
        visibility: "internal",
      },
      { id: "a.note2", text: { fa: PUBLIC_NOTE }, confidentialityHits: [], visibility: "public" },
      { id: "a.note3", text: { fa: SHORT_NOTE }, confidentialityHits: [], visibility: "internal" },
    ],
  });
  write("content/review-ledger.json", { topics: { "2024-maj-a": { notes: [{ text: LEDGER }] } } });
  write("content/topics/2024-maj-a.json", topic("2024-maj-a", "approved", APPROVED_QUESTION));
  write("content/topics/2024-maj-b.json", topic("2024-maj-b", "extracted", UNAPPROVED_QUESTION));
  write("content/themes.json", { themes: [{ title: { da: "Arbejde" } }] });
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
  it("collects internal notes and the ledger, but not public notes or short hits", () => {
    const c = canaries("preview");
    const windows = [...c.windows.keys()].join("\n");
    expect(windows).toContain(normalise(NOTE).slice(0, 24));
    expect(windows).not.toContain("Approved tip");
    expect(c.tokens.has("Skriftlig 2026")).toBe(true);
    expect(c.skippedHits).toEqual(["2026"]);
    expect(c.tokens.has("2024-maj-b")).toBe(false);
  });

  it("drops canaries that quote text the channel publishes", () => {
    const windows = [...canaries("preview").windows.keys()];
    expect(windows.some((w) => PUBLISHED_TITLE.includes(w))).toBe(false);
    expect(windows.some((w) => normalise(LEDGER).startsWith(w))).toBe(true);
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
    write("content/internal/drafts/links.json", { text: "An internal draft link note that must not ship." });
    expect([...canaries("preview").counts.keys()]).toContain("internal:drafts/links.json");
  });
});

describe("scanBuild", () => {
  it("passes a clean build", () => {
    expect(scan("preview")).toEqual([]);
    expect(scan("production")).toEqual([]);
  });

  const uEscape = (text: string) =>
    text.replace(/[^\x20-\x7e]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`);

  it.each([
    ["raw", SHORT_NOTE],
    ["JSON-escaped", JSON.stringify({ note: SHORT_NOTE })],
    [
      "double JSON-escaped (flight data)",
      `self.__next_f.push([1,${JSON.stringify(JSON.stringify(SHORT_NOTE))}])`,
    ],
    ["\\u-escaped", uEscape(JSON.stringify(SHORT_NOTE))],
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
});
