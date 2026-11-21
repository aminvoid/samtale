"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useAudioPlayer } from "@/lib/audio/player";
import type { MockDeck } from "@/lib/content/repository";
import type { AnnouncePort, MockExamDestination, MockExamPorts } from "../ports";
import { createAudioPort } from "./audio";
import { useMockSession } from "./mock-session-provider";
import { browserClock, browserVisibility, createWakeLockPort } from "./platform";
import { createRecorderPort, type MicrophoneStrategy } from "./recorder";

interface BrowserPortOptions {
  announce: AnnouncePort["emit"];
  navigate: (destination: MockExamDestination) => void;
  microphoneStrategy?: MicrophoneStrategy;
}

/** The deck is serializable data returned by getMockDeck on the server. */
export function useBrowserMockExamPorts(deck: MockDeck, options: BrowserPortOptions): MockExamPorts {
  const player = useAudioPlayer();
  const session = useMockSession();
  const strategy = options.microphoneStrategy ?? "keep-open";
  const callbacks = useRef(options);
  useLayoutEffect(() => {
    callbacks.current = options;
  }, [options]);

  return useMemo(
    () => ({
      ...session,
      audio: createAudioPort(player, deck),
      recorder: createRecorderPort(strategy),
      announce: {
        emit: (message) => {
          callbacks.current.announce(message);
        },
      },
      clock: browserClock,
      wakeLock: createWakeLockPort(),
      visibility: browserVisibility,
      navigate: (destination) => {
        callbacks.current.navigate(destination);
      },
    }),
    [deck, player, session, strategy],
  );
}
