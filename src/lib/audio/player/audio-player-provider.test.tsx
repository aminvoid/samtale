import { act, cleanup, fireEvent, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AudioPlayerProvider, useAudioPlayer, useClip } from "./index";

const pathname = vi.hoisted(() => vi.fn<() => string>());
vi.mock("next/navigation", () => ({ usePathname: pathname }));

const first = { id: "first", url: "/audio/first.mp3", durationMs: 4000 };
const second = { id: "second", url: "blob:second", durationMs: 6000 };

function Wrapper({ children }: { children: ReactNode }) {
  return <AudioPlayerProvider clips={[first]}>{children}</AudioPlayerProvider>;
}

function setup() {
  let paused = true;
  let ended = false;
  vi.spyOn(HTMLMediaElement.prototype, "paused", "get").mockImplementation(() => paused);
  vi.spyOn(HTMLMediaElement.prototype, "ended", "get").mockImplementation(() => ended);
  const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(() => {
    paused = false;
    ended = false;
    return Promise.resolve();
  });
  const pause = vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {
    paused = true;
  });
  const load = vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => undefined);
  const hook = renderHook(
    () => ({ first: useClip(first.id), second: useClip(second.id, second), player: useAudioPlayer() }),
    { wrapper: Wrapper },
  );

  function media() {
    const element = play.mock.contexts[0];
    if (element instanceof HTMLAudioElement) return element;
    throw new Error("Expected playback on an audio element");
  }

  return {
    ...hook,
    play,
    pause,
    load,
    media,
    finish: () => {
      paused = true;
      ended = true;
      fireEvent.ended(media());
    },
    interrupt: () => {
      paused = true;
      fireEvent.pause(media());
    },
    fail: () => {
      const mediaError: MediaError = {
        code: 3,
        message: "",
        MEDIA_ERR_ABORTED: 1,
        MEDIA_ERR_NETWORK: 2,
        MEDIA_ERR_DECODE: 3,
        MEDIA_ERR_SRC_NOT_SUPPORTED: 4,
      };
      Object.defineProperty(media(), "error", { value: mediaError, configurable: true });
      fireEvent.error(media());
      Object.defineProperty(media(), "error", { value: null });
    },
  };
}

beforeEach(() => pathname.mockReturnValue("/fa/study"));
afterEach(cleanup);

describe("AudioPlayerProvider", () => {
  it("calls play synchronously on the first gesture and switches clips on the same element", () => {
    const { result, play, pause, media } = setup();

    expect(play).not.toHaveBeenCalled();
    act(() => {
      result.current.first.play();
      expect(play).toHaveBeenCalledTimes(1);
    });
    expect(media()).toHaveAttribute("preload", "none");
    expect(media()).toHaveAttribute("src", first.url);
    expect(result.current.first.status).toBe("loading");

    act(() => {
      result.current.first.play();
    });
    expect(play).toHaveBeenCalledTimes(1);
    fireEvent.playing(media());
    expect(result.current.first.status).toBe("playing");

    pause.mockClear();
    const element = media();
    play.mockClear();
    act(() => {
      result.current.second.play();
    });
    expect(play).toHaveBeenCalledOnce();
    expect(play.mock.contexts[0]).toBe(element);
    expect(pause).toHaveBeenCalledOnce();
    expect(pause).toHaveBeenCalledBefore(play);
    expect(media()).toHaveAttribute("src", second.url);
    expect(result.current.first.status).toBe("idle");

    fireEvent.playing(media());
    act(() => {
      result.current.first.pause();
    });
    expect(result.current.second.status).toBe("playing");
  });

  it("does not start native playback if a subscriber stops the loading clip", () => {
    const { result, play } = setup();
    const player = result.current.player;
    const unsubscribe = player.subscribe(() => {
      if (player.getSnapshot().status === "loading") player.stop();
    });
    act(() => {
      result.current.first.play();
    });
    unsubscribe();
    expect(play).not.toHaveBeenCalled();
    expect(result.current.first.status).toBe("idle");
  });

  it("seeks in milliseconds, preserves pitch across rates, and resets after ending", () => {
    const { result, media, finish } = setup();
    act(() => {
      result.current.first.setRate(0.75);
    });
    act(() => {
      result.current.first.play();
    });
    fireEvent.playing(media());
    expect(media().playbackRate).toBe(0.75);
    expect(media().preservesPitch).toBe(true);
    expect(result.current.first.durationMs).toBe(first.durationMs);

    act(() => {
      result.current.first.seek(2800);
    });
    expect(media().currentTime).toBe(2.8);
    act(() => {
      result.current.first.pause();
    });
    expect(result.current.first).toMatchObject({ status: "paused", currentTimeMs: 2800, interrupted: false });

    act(() => {
      result.current.first.setRate(1.25);
    });
    expect(media().playbackRate).toBe(1.25);
    act(() => {
      result.current.first.play();
    });
    fireEvent.playing(media());
    expect(media().currentTime).toBe(2.8);
    finish();
    expect(result.current.first).toMatchObject({ status: "ended", currentTimeMs: 0 });

    act(() => {
      result.current.first.play();
    });
    expect(media().currentTime).toBe(0);
  });

  it("exposes a blocked play and retries the same clip from a later gesture", async () => {
    const { result, play, media, fail } = setup();
    play.mockRejectedValueOnce(new DOMException("Gesture required", "NotAllowedError"));
    await act(async () => {
      result.current.first.play();
      await Promise.resolve();
    });
    expect(result.current.first).toMatchObject({ status: "error", error: "playback-blocked" });

    act(() => {
      result.current.first.play();
    });
    fireEvent.playing(media());
    fail();
    expect(result.current.first).toMatchObject({ status: "error", error: "media" });

    act(() => {
      result.current.first.play();
      expect(play).toHaveBeenCalledTimes(3);
    });
    fireEvent.playing(media());
    expect(result.current.first).toMatchObject({ status: "playing", error: null });
  });

  it("ignores late play rejections after switching clips", async () => {
    const { result, play, media } = setup();
    const pending = Promise.withResolvers<undefined>();
    play.mockReturnValueOnce(pending.promise);
    act(() => {
      result.current.first.play();
    });
    act(() => {
      result.current.second.play();
    });
    fireEvent.playing(media());

    await act(async () => {
      pending.reject(new DOMException("Source replaced", "AbortError"));
      await Promise.resolve();
    });
    expect(result.current.first.status).toBe("idle");
    expect(result.current.second.status).toBe("playing");
  });

  it("reports native interruption and releases the source on navigation", () => {
    const { result, media, load, rerender, interrupt } = setup();
    act(() => {
      result.current.first.play();
    });
    fireEvent.playing(media());
    interrupt();
    expect(result.current.first).toMatchObject({ status: "paused", interrupted: true });

    act(() => {
      result.current.first.play();
    });
    pathname.mockReturnValue("/fa/other");
    rerender();
    expect(result.current.player.getSnapshot().status).toBe("idle");
    expect(media()).not.toHaveAttribute("src");
    expect(load).toHaveBeenCalledOnce();
  });
});
