import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { preloadClips, type PreloadProgress } from "../preload";

const first = "/audio/first.mp3";
const second = "/audio/second.mp3";
const fetchClip = vi.fn<typeof fetch>();
const createObjectURL = vi.fn<typeof URL.createObjectURL>();
const revokeObjectURL = vi.fn<typeof URL.revokeObjectURL>();

class MockURL extends URL {
  static override createObjectURL = createObjectURL;
  static override revokeObjectURL = revokeObjectURL;
}

beforeEach(() => {
  fetchClip.mockReset();
  createObjectURL.mockReset();
  revokeObjectURL.mockReset();
  vi.stubGlobal("fetch", fetchClip);
  vi.stubGlobal("URL", MockURL);
});

afterEach(() => vi.unstubAllGlobals());

describe("preloadClips", () => {
  it("downloads distinct clips as Blobs, reports progress, and releases both object URLs", async () => {
    fetchClip
      .mockResolvedValueOnce(new Response("first clip"))
      .mockResolvedValueOnce(new Response("second clip"));
    createObjectURL.mockReturnValueOnce("blob:first").mockReturnValueOnce("blob:second");
    const onProgress = vi.fn<(progress: PreloadProgress) => void>();

    const session = preloadClips([first, second, first], onProgress);
    const urls = await session.promise;

    expect(fetchClip).toHaveBeenCalledTimes(2);
    expect([...urls]).toEqual([
      [first, "blob:first"],
      [second, "blob:second"],
    ]);
    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(onProgress.mock.calls.flat()).toEqual([
      { loaded: 0, total: 2 },
      { loaded: 1, total: 2 },
      { loaded: 2, total: 2 },
    ]);

    session.revoke();
    session.revoke();
    expect(revokeObjectURL.mock.calls.flat()).toEqual(["blob:first", "blob:second"]);
    expect(urls.size).toBe(0);
  });

  it("aborts pending requests, revokes completed URLs, and discards late responses", async () => {
    const response = Promise.withResolvers<Response>();
    const firstLoaded = Promise.withResolvers<undefined>();
    fetchClip.mockResolvedValueOnce(new Response("first clip")).mockReturnValueOnce(response.promise);
    createObjectURL.mockReturnValueOnce("blob:first");

    const session = preloadClips([first, second], ({ loaded }) => {
      if (loaded === 1) firstLoaded.resolve(undefined);
    });
    await firstLoaded.promise;
    session.abort();

    const signal = fetchClip.mock.calls[1]?.[1]?.signal;
    expect(signal?.aborted).toBe(true);
    expect(revokeObjectURL).toHaveBeenCalledExactlyOnceWith("blob:first");

    response.resolve(new Response("late clip"));
    await expect(session.promise).rejects.toMatchObject({ name: "AbortError" });
    expect(createObjectURL).toHaveBeenCalledOnce();
  });

  it("releases URLs and aborts sibling work if a clip fails", async () => {
    const response = Promise.withResolvers<Response>();
    const firstLoaded = Promise.withResolvers<undefined>();
    fetchClip.mockResolvedValueOnce(new Response("first clip")).mockReturnValueOnce(response.promise);
    createObjectURL.mockReturnValueOnce("blob:first");

    const session = preloadClips([first, second], ({ loaded }) => {
      if (loaded === 1) firstLoaded.resolve(undefined);
    });
    await firstLoaded.promise;
    response.resolve(new Response(null, { status: 404 }));

    await expect(session.promise).rejects.toThrow("404");
    expect(fetchClip.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
    expect(revokeObjectURL).toHaveBeenCalledExactlyOnceWith("blob:first");
  });
});
