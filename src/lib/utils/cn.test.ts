import { describe, expect, it } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("joins class names and drops falsy values", () => {
    expect(cn("mbs-4", false, undefined, null, "font-bold")).toBe("mbs-4 font-bold");
  });

  it("lets later Tailwind classes win over conflicting earlier ones", () => {
    expect(cn("mbs-2 ps-2", "ps-4")).toBe("mbs-2 ps-4");
  });

  it("accepts objects and arrays", () => {
    expect(cn(["mbs-2", { underline: true, "font-bold": false }])).toBe("mbs-2 underline");
  });

  it("returns an empty string for no classes", () => {
    expect(cn()).toBe("");
  });
});
