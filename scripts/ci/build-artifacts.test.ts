// @vitest-environment node
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, beforeEach, expect, it } from "vitest";
import { assertReadModelChannel, READ_MODEL_PATH } from "./build-artifacts";

let root: string;
let model: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "build-artifacts-"));
  model = join(root, READ_MODEL_PATH);
  mkdirSync(dirname(model), { recursive: true });
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

it("rejects stale preview output during a production release build", () => {
  writeFileSync(model, JSON.stringify({ channel: "preview" }));
  expect(() => {
    assertReadModelChannel(root, "production");
  }).toThrow(/CONTENT_RELEASE=production/);
  expect(() => {
    assertReadModelChannel(root, "preview");
  }).not.toThrow();
});

it("accepts matching production output", () => {
  writeFileSync(model, JSON.stringify({ channel: "production" }));
  expect(() => {
    assertReadModelChannel(root, "production");
  }).not.toThrow();
});

it("requires a generated model", () => {
  expect(() => {
    assertReadModelChannel(root, "production");
  }).toThrow(/read-model\.json/);
});
