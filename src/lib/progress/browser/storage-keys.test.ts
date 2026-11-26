import { afterEach, describe, expect, it, vi } from "vitest";
import { hasInProgressMarker, inProgressMarkerKey } from "./storage-keys";

afterEach(() => {
  window.sessionStorage.clear();
  vi.restoreAllMocks();
});

describe("in-progress marker key", () => {
  it("keeps the published key for the default database and prefixes others", () => {
    expect(inProgressMarkerKey()).toBe("pd3:mock:in-progress:v1");
    expect(inProgressMarkerKey("test-db")).toBe("test-db:pd3:mock:in-progress:v1");
  });

  it("reports whether this tab holds a marker, valid or not", () => {
    expect(hasInProgressMarker()).toBe(false);
    window.sessionStorage.setItem("pd3:mock:in-progress:v1", "{");
    expect(hasInProgressMarker()).toBe(true);
    expect(hasInProgressMarker("test-db")).toBe(false);
  });

  it("treats unavailable session storage as no marker", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });
    expect(hasInProgressMarker()).toBe(false);
  });
});
