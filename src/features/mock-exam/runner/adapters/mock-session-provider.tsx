"use client";

import { createContext, useContext, useLayoutEffect, useState, type ReactNode } from "react";
import { createProgressStore } from "@/lib/progress/create-progress-store";
import { createRecordingStore } from "@/lib/progress/recording-store";
import { createProgressPorts } from "./progress";
import { createSessionRecordings } from "./session-recordings";

function createMockSession() {
  const progressStore = createProgressStore();
  return {
    ...createProgressPorts(progressStore),
    recordings: createSessionRecordings(createRecordingStore(), progressStore),
  };
}

const MockSessionContext = createContext<ReturnType<typeof createMockSession> | null>(null);

/** Mount in the mock section so recordings survive the handoff to review. */
export function MockSessionProvider({ children }: { children: ReactNode }) {
  const [session] = useState(createMockSession);
  useLayoutEffect(
    () => () => {
      session.recordings.clear();
    },
    [session],
  );
  return <MockSessionContext value={session}>{children}</MockSessionContext>;
}

export function useMockSession() {
  const session = useContext(MockSessionContext);
  if (session === null) throw new Error("Mock exam hooks require MockSessionProvider");
  return session;
}
