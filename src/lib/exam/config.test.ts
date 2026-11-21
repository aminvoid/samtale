// @vitest-environment node
import { expect, it } from "vitest";
import { examConfig, examConfigSchema } from "./config";

it("validates C1–C22 and retains the existing sound-check exports", () => {
  expect(examConfigSchema.parse(examConfig)).toEqual(examConfig);
  expect(examConfig.soundCheckClipId).toBe("examiner.soundCheck");
  expect(examConfig.instructionLineId).toBeNull();
  expect(examConfigSchema.safeParse({ ...examConfig, slowRepeatRate: 1 }).success).toBe(false);
  expect(
    examConfigSchema.safeParse({
      ...examConfig,
      part1CutoffSeconds: examConfig.part1HandoverSeconds,
    }).success,
  ).toBe(false);
  expect(
    examConfigSchema.safeParse({
      ...examConfig,
      graceCeilingSeconds: examConfig.examLimitSeconds,
    }).success,
  ).toBe(false);
});
