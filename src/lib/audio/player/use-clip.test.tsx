import { act, cleanup, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, expect, it, vi } from "vitest";
import { AudioPlayerProvider } from "./audio-player-provider";
import { useClip } from "./use-clip";

vi.mock("next/navigation", () => ({ usePathname: () => "/fa/study" }));

const clip = { id: "available", url: "/audio/sample.mp3", durationMs: 4000 };

function wrapper({ children }: { children: ReactNode }) {
  return <AudioPlayerProvider clips={[clip]}>{children}</AudioPlayerProvider>;
}

afterEach(cleanup);

it("keeps a missing clip idle and prevents its controls from changing the active clip", () => {
  const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
  const pause = vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => undefined);
  vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => undefined);
  vi.spyOn(HTMLMediaElement.prototype, "paused", "get").mockReturnValue(false);
  const { result } = renderHook(() => ({ available: useClip(clip.id), missing: useClip("missing") }), {
    wrapper,
  });

  act(() => {
    result.current.available.play();
  });
  const media = play.mock.contexts[0];
  if (!(media instanceof HTMLAudioElement)) throw new Error("Expected an audio element");
  act(() => {
    media.dispatchEvent(new Event("playing"));
    result.current.available.seek(1000);
  });
  act(() => {
    result.current.missing.play();
    result.current.missing.seek(2000);
    result.current.missing.pause();
  });

  expect(result.current.missing).toMatchObject({ unavailable: true, status: "idle" });
  expect(result.current.available).toMatchObject({
    unavailable: false,
    status: "playing",
    currentTimeMs: 1000,
  });
  expect(play).toHaveBeenCalledOnce();
  expect(pause).not.toHaveBeenCalled();
});
