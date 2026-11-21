"use client";

import { useLayoutEffect, useReducer, useRef, useState } from "react";
import type { Event } from "../machine";
import type { MockExamPorts } from "./ports";
import { createMockExamRuntime, initialSnapshot, reduceMockExam, type MockExamSetup } from "./runtime";

type WithoutTime<T = Event> = T extends Event ? Omit<T, "at"> : never;
export type MockExamAction = WithoutTime & {
  type:
    | "SOUND_CHECK_PLAY"
    | "SOUND_CHECK_HEARD"
    | "SOUND_CHECK_PROBLEM"
    | "MIC_ALLOW"
    | "MIC_SKIP"
    | "CONTINUE"
    | "INSTRUCTION_SKIP"
    | "CARD_TAPPED"
    | "START"
    | "RETRY_LOAD"
    | "LOOK_PAUSE"
    | "LOOK_RESUME"
    | "LOOK_EXTEND"
    | "LOOK_SKIP"
    | "SITUATION_CHOSEN"
    | "TAP_TO_HEAR"
    | "DONE"
    | "HINTS_OPENED"
    | "HINTS_CLOSED"
    | "REPEAT"
    | "REPEAT_INTRO"
    | "RERECORD"
    | "PAUSE"
    | "RESUME"
    | "SHOW_TEXT"
    | "HIDE_TEXT"
    | "TIMERS_TOGGLED"
    | "LEAVE_REQUESTED"
    | "LEAVE_CONFIRMED"
    | "LEAVE_CANCELLED"
    | "CONTINUE_AFTER_INTERRUPTION"
    | "RESTART"
    | "END_AND_REVIEW"
    | "RETRY_AUDIO"
    | "GO_TO_REVIEW"
    | "DISMISS_RELOAD_NOTICE"
    | "OPTIONS_SET";
};

/** Mount once per attempt flow. Call send directly from the gesture for START and media actions. */
export function useMockExam(setup: MockExamSetup, ports: MockExamPorts) {
  const [snapshot, dispatch] = useReducer(reduceMockExam, initialSnapshot);
  const [initialSetup] = useState(setup);
  const runtime = useRef<ReturnType<typeof createMockExamRuntime> | null>(null);

  useLayoutEffect(() => {
    const host = createMockExamRuntime(ports, dispatch);
    runtime.current = host;
    void host.start(initialSetup);
    return () => {
      runtime.current = null;
      host.dispose();
    };
  }, [initialSetup, ports]);

  return {
    state: snapshot.machine?.state ?? null,
    preloadProgress: snapshot.preloadProgress,
    micPreviouslyDenied: snapshot.micPreviouslyDenied,
    now: () => ports.clock.now(),
    send: (action: MockExamAction) => runtime.current?.send(action),
  };
}
