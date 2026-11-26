"use client";

import { createContext, useContext, useLayoutEffect, useState, type ReactNode } from "react";
// Lazy: the mock start page (and its prefetch from every page's tab bar) doesn't need IndexedDB and
// the schemas until the learner starts or reviews an attempt (ADR-0014 JS budget).
import { createLazyProgressStore, createLazyRecordingStore } from "@/lib/progress/lazy-stores";
import { createProgressPorts } from "./progress";
import { createSessionRecordings } from "./session-recordings";

function createMockSession() {
  const progressStore = createLazyProgressStore();
  return {
    ...createProgressPorts(progressStore),
    recordings: createSessionRecordings(createLazyRecordingStore(), progressStore),
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
