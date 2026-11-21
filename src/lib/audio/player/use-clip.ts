"use client";

import { useSyncExternalStore } from "react";
import type { AudioRef } from "@/lib/content/schema/published";
import { usePlayerContext } from "./audio-player-provider";

/** Pass a published audio ref at the point of use, or look it up in the provider's clip list. */
export function useClip(itemId: string, audio?: Pick<AudioRef, "url" | "durationMs">) {
  const { player, clips } = usePlayerContext();
  const clip = audio === undefined ? clips.find(({ id }) => id === itemId) : { ...audio, id: itemId };
  const state = useSyncExternalStore(
    player.subscribe,
    () => player.getClipSnapshot(itemId),
    player.getServerSnapshot,
  );

  return {
    ...state,
    unavailable: clip === undefined,
    play: () => {
      if (clip !== undefined) player.play(clip);
    },
    pause: () => {
      if (player.getSnapshot().clipId === itemId) player.pause();
    },
    seek: (timeMs: number) => {
      if (player.getSnapshot().clipId === itemId) player.seek(timeMs);
    },
    setRate: player.setRate,
  };
}
