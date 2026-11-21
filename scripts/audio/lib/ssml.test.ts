import { describe, expect, it } from "vitest";
import { findMatches, LEXICON_VERSION, type Replacement, RULES } from "./lexicon";
import { buildSsml, escapeXml } from "./ssml";

const spoken = (text: string): string[] =>
  findMatches(text).map((m) => {
    const r: Replacement = m.replacement;
    return r.kind === "say" ? r.text : r.kind;
  });
const written = (text: string): string[] => findMatches(text).map((m) => text.slice(m.start, m.end));
const body = (ssml: string) => ssml.slice(ssml.indexOf("<voice"), ssml.indexOf("</voice>")).replace(/^<voice[^>]*>/, "");

describe("lexicon rules", () => {
  it("finds the Danish abbreviations from the speech rules", () => {
    const text = "Vi taler fx om bl.a. løn, ca. 10 timer, f.eks. i weekenden, pga. travlhed, mv. og osv. i dag";
    expect(written(text)).toEqual(["fx", "bl.a.", "ca.", "f.eks.", "pga.", "mv.", "osv."]);
    expect(spoken(text)).toEqual([
      "for eksempel",
      "blandt andet",
      "cirka",
      "for eksempel",
      "på grund af",
      "med videre",
      "og så videre",
    ]);
  });

  it("keeps a capital at the start of a sentence", () => {
    expect(spoken("Fx kan man cykle.")).toEqual(["For eksempel"]);
  });

  it("keeps the full stop when the abbreviation also ends the sentence", () => {
    expect(spoken("Løn, ferie osv. Det er vigtigt.")).toEqual(["og så videre."]);
    expect(spoken("Løn, ferie osv.")).toEqual(["og så videre."]);
  });

  it("ignores the letters inside longer words", () => {
    expect(findMatches("fxaf afx Fxyz cirka")).toEqual([]);
  });

  it("applies the Danish review's TTS hints (2026-11-20)", () => {
    expect(spoken("Du har nu 10 sekunder til at overveje emnet")).toEqual(["ti sekunder"]);
    expect(spoken("Prøven hedder PD3.")).toEqual(["pe de tre"]);
    expect(findMatches("idrætsbegivenheder – fx børnepasning").map((m) => m.replacement)).toEqual([
      { kind: "pause", ms: 250 },
      { kind: "say", text: "for eksempel" },
    ]);
  });

  it("says both alternatives after a pause, for both written variants (exam review S2)", () => {
    for (const variant of ["Hvorfor?/Hvorfor ikke?", "Hvorfor / hvorfor ikke?"]) {
      const [m] = findMatches(`Er det godt? ${variant}`);
      expect(m?.replacement).toEqual({ kind: "say", text: "Hvorfor eller hvorfor ikke?", pauseBeforeMs: 800 });
    }
  });

  it("keeps the reviewer's conditional hints switched off until a listening test needs them", () => {
    const off = RULES.filter((r) => !r.enabled).map((r) => r.id);
    expect(off).toEqual(["social-og-sundhedsassistenter", "jord-og-betonarbejdere", "feedback", "overordnet"]);
    expect(findMatches("social- og sundhedsassistenter, feedback, overordnet")).toEqual([]);
  });

  it("can apply a phoneme rule when one is switched on", () => {
    const rules = RULES.map((r) => (r.id === "overordnet" ? { ...r, enabled: true } : r));
    expect(findMatches("en mere overordnet karakter", rules)[0]?.replacement).toEqual({ kind: "phoneme", ipa: "ˈɒwɐˌɒːˀdnəð" });
  });

  it("has a stable lexicon version", () => {
    expect(LEXICON_VERSION).toMatch(/^[0-9a-f]{12}$/);
  });
});

describe("buildSsml", () => {
  it("wraps the text in da-DK speak and voice elements", () => {
    expect(buildSsml("Hej.", "da-DK-JeppeNeural").ssml).toBe(
      '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="da-DK"><voice name="da-DK-JeppeNeural">Hej.</voice></speak>',
    );
  });

  it("escapes XML characters and maps each entity back to one display character", () => {
    const built = buildSsml("A & B <C>", "da-DK-JeppeNeural");
    expect(body(built.ssml)).toBe("A &amp; B &lt;C&gt;");
    const amp = built.ssml.indexOf("&amp;");
    for (let i = amp; i < amp + 5; i++) expect([built.displayStart[i], built.displayEnd[i]]).toEqual([2, 3]);
    expect(escapeXml(`"'`)).toBe("&quot;&apos;");
  });

  it("speaks the abbreviation as plain text (not <sub>) mapped to the abbreviation", () => {
    const text = "Mange, fx sygeplejersker.";
    const built = buildSsml(text, "da-DK-ChristelNeural");
    expect(body(built.ssml)).toBe("Mange, for eksempel sygeplejersker.");
    const at = built.ssml.indexOf("for eksempel");
    expect(built.displayStart[at]).toBe(7);
    expect(built.displayEnd[at + "for eksempel".length - 1]).toBe(9);
  });

  it("puts a break before the spoken alternative and leaves the break unmapped", () => {
    const text = "Er det godt? Hvorfor?/Hvorfor ikke?";
    const built = buildSsml(text, "da-DK-JeppeNeural");
    expect(body(built.ssml)).toBe('Er det godt? <break time="800ms"/>Hvorfor eller hvorfor ikke?');
    expect(built.displayStart[built.ssml.indexOf("<break")]).toBe(-1);
    const say = built.ssml.indexOf("Hvorfor eller");
    expect([built.displayStart[say], built.displayEnd[say]]).toEqual([13, text.length]);
  });

  it("replaces a spaced en dash with a pause", () => {
    expect(body(buildSsml("områder – fx børn", "da-DK-JeppeNeural").ssml)).toBe(
      'områder <break time="250ms"/> for eksempel børn',
    );
  });

  it("counts every billable character except the speak and voice tags", () => {
    expect(buildSsml("Hej.", "da-DK-JeppeNeural").billableChars).toBe(4);
    expect(buildSsml("fx", "da-DK-JeppeNeural").billableChars).toBe("for eksempel".length);
    // Prosody and break markup is billed (Azure pricing note, checked 2026-11-20).
    expect(buildSsml("Hej.", "da-DK-JeppeNeural", { rate: "-25%" }).billableChars).toBe(
      '<prosody rate="-25%">Hej.</prosody>'.length,
    );
  });

  it("adds sentence-boundary silence with the mstts namespace", () => {
    const { ssml } = buildSsml("Et. To.", "da-DK-JeppeNeural", { sentencePauseMs: 300 });
    expect(ssml).toContain('xmlns:mstts="http://www.w3.org/2001/mstts"');
    expect(ssml).toContain('<mstts:silence type="Sentenceboundary" value="300ms"/>');
  });

  it("marks markup as unmapped", () => {
    const built = buildSsml("Hej", "da-DK-JeppeNeural", { rate: "-10%" });
    expect(built.displayStart[0]).toBe(-1);
    expect(built.displayStart[built.ssml.length - 1]).toBe(-1);
  });

  it("rejects unsafe settings", () => {
    expect(() => buildSsml("x", "da-DK-JeppeNeural", { rate: "slow" })).toThrow(/rate/);
    expect(() => buildSsml("x", 'bad" name')).toThrow(/voice/);
  });
});
