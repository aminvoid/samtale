import { afterEach, describe, expect, it, vi } from "vitest";
import { errorCodeOf, getLastErrorCode, reportError } from "./report-error";

describe("reportError", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("derives a code from the digest, the error name or the thrown type", () => {
    expect(errorCodeOf(Object.assign(new Error("x"), { digest: "123456" }))).toBe("123456");
    expect(errorCodeOf(new TypeError("x"))).toBe("TypeError");
    expect(errorCodeOf(Object.assign(new Error("x"), { digest: "" }))).toBe("Error");
    expect(errorCodeOf("a string was thrown")).toBe("string");
    expect(errorCodeOf(undefined)).toBe("undefined");
  });

  it("keeps the last error code and logs only in development", () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.stubEnv("NODE_ENV", "production");
    reportError(new RangeError("x"), { area: "route" });
    expect(getLastErrorCode()).toBe("RangeError");
    expect(log).not.toHaveBeenCalled();

    vi.stubEnv("NODE_ENV", "development");
    const error = new Error("boom");
    // Not a real content ID: Tailwind scans test files too, and "[area:id]" looks like a CSS class to it.
    reportError(error, { area: "audio", itemId: "clip-7" });
    expect(log).toHaveBeenCalledWith("[audio:clip-7]", error);
    reportError(error, { area: "route" });
    expect(log).toHaveBeenLastCalledWith("[route]", error);
  });
});
