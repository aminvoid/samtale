import { describe, expect, it } from "vitest";
import { priceClassOf } from "../config";
import { parseSpeechEnv } from "../env";
import { estimateCost, formatUsd } from "./cost";
import { canonicalJson, clipHash } from "./hash";
import { redact } from "./redact";

describe("priceClassOf", () => {
  it("classifies voices by name", () => {
    expect(priceClassOf("da-DK-ChristelNeural")).toBe("neural");
    expect(priceClassOf("da-DK-Christel:DragonLatestNeural")).toBe("neural");
    expect(priceClassOf("en-US-Ava:DragonHDLatestNeural")).toBe("neuralHd");
    expect(priceClassOf("da-DK-Grant:MAI-Voice-2.1")).toBe("mai");
    expect(priceClassOf("da-DK-Grant:MAI-Voice-2.1-Flash")).toBe("maiFlash");
  });
});

describe("estimateCost", () => {
  it("prices characters per class and checks the F0 allowance", () => {
    const est = estimateCost([
      { voice: "da-DK-ChristelNeural", billableChars: 600_000 },
      { voice: "da-DK-Grant:MAI-Voice-2.1", billableChars: 100_000 },
    ]);
    expect(est.chars).toBe(700_000);
    expect(est.s0Usd).toBeCloseTo(0.6 * 15 + 0.1 * 22);
    expect(est.lines.find((l) => l.priceClass === "mai")?.verified).toBe(false);
    expect(est.f0CharsOverAllowance).toBe(200_000);
    expect(est.f0Minutes).toBe(1);
    expect(formatUsd(est.s0Usd)).toBe("$11.20");
    expect(formatUsd(0.004)).toBe("$0.0040");
  });
});

describe("clipHash", () => {
  const input = {
    ssml: "<speak/>",
    voice: "v",
    outputFormat: "f",
    ssmlSettings: {},
    lexiconVersion: "l",
    generatorVersion: "g",
  };

  it("is 20 hex characters and independent of key order", () => {
    expect(clipHash(input)).toMatch(/^[0-9a-f]{20}$/);
    expect(canonicalJson({ b: 1, a: [2, { d: 3, c: undefined }] })).toBe('{"a":[2,{"d":3}],"b":1}');
  });

  it("changes with every input", () => {
    const h = clipHash(input);
    const variants = [
      { ...input, ssml: "<speak>x</speak>" },
      { ...input, voice: "x" },
      { ...input, outputFormat: "x" },
      { ...input, ssmlSettings: { rate: "-10%" } },
      { ...input, lexiconVersion: "x" },
      { ...input, generatorVersion: "x" },
    ];
    for (const changed of variants) expect(clipHash(changed)).not.toBe(h);
  });
});

describe("secrets", () => {
  const key = "k".repeat(40);

  it("parses the speech environment without echoing the key", () => {
    expect(parseSpeechEnv({ AZURE_SPEECH_KEY: key, AZURE_SPEECH_REGION: "swedencentral" })).toEqual({
      key,
      region: "swedencentral",
    });
    let message = "";
    try {
      parseSpeechEnv({ AZURE_SPEECH_KEY: key, AZURE_SPEECH_REGION: "Sweden Central!" });
    } catch (e) {
      message = e instanceof Error ? e.message : "";
    }
    expect(message).toMatch(/AZURE_SPEECH_REGION/);
    expect(message).not.toContain(key);
    expect(() => parseSpeechEnv({ AZURE_SPEECH_REGION: "swedencentral" })).toThrow(/AZURE_SPEECH_KEY/);
    expect(() => parseSpeechEnv({ AZURE_SPEECH_KEY: "<your-key-here-placeholder>", AZURE_SPEECH_REGION: "x" })).toThrow(
      /placeholder/,
    );
  });

  it("redacts the key from error text", () => {
    expect(redact(`failed for ${key} twice ${key}`, key)).toBe("failed for [redacted] twice [redacted]");
  });
});
