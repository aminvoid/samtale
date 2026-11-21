"use client";

import { usePathname } from "next/navigation";
import { createContext, Suspense, useContext, useLayoutEffect, useState, type ReactNode } from "react";
import { createAudioPlayer, type AudioClip } from "./audio-player";

type Player = ReturnType<typeof createAudioPlayer>;
export type AudioPlayerController = Omit<Player, "dispose" | "getClipSnapshot">;
const PlayerContext = createContext<{ player: Player; clips: readonly AudioClip[] } | null>(null);
const noClips: readonly AudioClip[] = [];

function StopOnNavigation({ stop }: { stop: Player["stop"] }) {
  const pathname = usePathname();
  useLayoutEffect(() => {
    window.addEventListener("pagehide", stop);
    return () => {
      window.removeEventListener("pagehide", stop);
      stop();
    };
  }, [pathname, stop]);
  return null;
}

/** Mount once in the locale layout. Clips can also be supplied by each consumer. */
export function AudioPlayerProvider({
  children,
  clips = noClips,
}: {
  children: ReactNode;
  clips?: readonly AudioClip[];
}) {
  const [player] = useState(createAudioPlayer);
  useLayoutEffect(() => player.dispose, [player]);

  return (
    <PlayerContext value={{ player, clips }}>
      <Suspense fallback={null}>
        <StopOnNavigation stop={player.stop} />
      </Suspense>
      {children}
    </PlayerContext>
  );
}

export function usePlayerContext() {
  const context = useContext(PlayerContext);
  if (context === null) throw new Error("Audio hooks require AudioPlayerProvider");
  return context;
}

/** Shared transport and external store for coordinating a sequence of clips. */
export function useAudioPlayer(): AudioPlayerController {
  return usePlayerContext().player;
}
