import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createAudioPlayer } from "./audio-player";

const clip = { id: "sample", url: "/audio/sample.mp3", durationMs: 4000 };

describe("audio player", () => {
  let player: ReturnType<typeof createAudioPlayer>;

  function stubMedia() {
    let paused = true;
    const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(() => {
      paused = false;
      return Promise.resolve();
    });
    vi.spyOn(HTMLMediaElement.prototype, "paused", "get").mockImplementation(() => paused);
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {
      paused = true;
    });
    return {
      play,
      element: () => {
        const media = play.mock.contexts[0];
        if (!(media instanceof HTMLAudioElement)) throw new Error("Expected an audio element");
        return media;
      },
    };
  }

  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => undefined);
    player = createAudioPlayer();
  });

  afterEach(() => {
    player.dispose();
    vi.useRealTimers();
  });

  it("waits for native playback, reports buffering and resumes updating the position", () => {
    const { element } = stubMedia();
    player.play(clip);
    const media = element();
    media.dispatchEvent(new Event("timeupdate"));
    expect(player.getSnapshot()).toMatchObject({ status: "loading", durationMs: null });

    media.dispatchEvent(new Event("playing"));
    expect(player.getSnapshot()).toMatchObject({ status: "playing", durationMs: clip.durationMs });
    media.currentTime = 0.5;
    vi.advanceTimersToNextFrame();
    expect(player.getSnapshot().currentTimeMs).toBe(500);

    media.dispatchEvent(new Event("waiting"));
    media.currentTime = 0.75;
    vi.advanceTimersToNextFrame();
    expect(player.getSnapshot()).toMatchObject({ status: "loading", currentTimeMs: 500 });
    media.dispatchEvent(new Event("playing"));
    expect(player.getSnapshot()).toMatchObject({ status: "playing", currentTimeMs: 750 });
  });

  it("uses native duration when known and clamps seek and position to the playable range", () => {
    const { element } = stubMedia();
    player.pause();
    player.seek(1000);
    expect(player.getSnapshot().status).toBe("idle");

    player.play(clip);
    const media = element();
    player.seek(1000);
    expect(media.currentTime).toBe(0);
    vi.spyOn(media, "duration", "get").mockReturnValue(2.5);
    media.dispatchEvent(new Event("loadedmetadata"));
    player.seek(1000);
    expect(media.currentTime).toBe(0);
    media.dispatchEvent(new Event("playing"));

    player.seek(5000);
    expect(media.currentTime).toBe(2.5);
    player.seek(Number.NaN);
    expect(media.currentTime).toBe(2.5);
    player.seek(-500);
    expect(media.currentTime).toBe(0);
    media.currentTime = 3;
    media.dispatchEvent(new Event("timeupdate"));
    expect(player.getSnapshot()).toMatchObject({ durationMs: 2500, currentTimeMs: 2500 });

    vi.spyOn(media, "ended", "get").mockReturnValue(true);
    media.dispatchEvent(new Event("pause"));
    media.dispatchEvent(new Event("ended"));
    media.dispatchEvent(new Event("timeupdate"));
    expect(player.getSnapshot()).toMatchObject({ status: "ended", currentTimeMs: 0, interrupted: false });
    player.seek(1000);
    expect(player.getSnapshot()).toMatchObject({ status: "paused", currentTimeMs: 1000 });
  });

  it("reports a rejected play as a media error and allows a retry", async () => {
    const { play, element } = stubMedia();
    play.mockRejectedValueOnce(new DOMException("Unsupported source", "NotSupportedError"));
    player.play(clip);
    const media = element();
    vi.spyOn(media, "duration", "get").mockReturnValue(4);
    media.dispatchEvent(new Event("loadedmetadata"));
    await Promise.resolve();
    vi.spyOn(media, "duration", "get").mockReturnValue(5);
    media.dispatchEvent(new Event("durationchange"));
    player.seek(1000);
    expect(player.getSnapshot()).toMatchObject({ status: "error", error: "media", durationMs: 4000 });
    expect(media.currentTime).toBe(0);

    player.play(clip);
    media.dispatchEvent(new Event("playing"));
    expect(player.getSnapshot()).toMatchObject({ status: "playing", error: null });
  });

  it("ignores browser events for inactive playback and clears media on stop", () => {
    const { element } = stubMedia();
    player.play(clip);
    const media = element();
    media.dispatchEvent(new Event("ended"));
    media.dispatchEvent(new Event("error"));
    expect(player.getSnapshot().status).toBe("loading");

    player.pause();
    player.pause();
    media.dispatchEvent(new Event("playing"));
    media.dispatchEvent(new Event("waiting"));
    media.dispatchEvent(new Event("ended"));
    expect(player.getSnapshot()).toMatchObject({ status: "paused", interrupted: false });

    player.setRate(1.25);
    const listener = vi.fn();
    player.subscribe(listener);
    player.setRate(1.25);
    expect(listener).not.toHaveBeenCalled();
    player.stop();
    media.dispatchEvent(new Event("timeupdate"));
    media.dispatchEvent(new Event("error"));
    expect(player.getSnapshot()).toMatchObject({ status: "idle", rate: 1.25, clipId: null });
    expect(media).not.toHaveAttribute("src");
    expect(listener).toHaveBeenCalledOnce();
  });
});
