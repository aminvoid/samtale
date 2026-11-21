"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { MockExamDestination } from "../index";

type Handoff = {
  destination: MockExamDestination | null;
  setDestination: (destination: MockExamDestination | null) => void;
};

const HandoffContext = createContext<Handoff | null>(null);

export function MockHandoff({ children }: { children: ReactNode }) {
  const [destination, setDestination] = useState<MockExamDestination | null>(null);
  return <HandoffContext value={{ destination, setDestination }}>{children}</HandoffContext>;
}

export function useMockHandoff() {
  const handoff = useContext(HandoffContext);
  if (handoff === null) throw new Error("The mock section requires MockHandoff");
  return handoff;
}

export function reviewHref(attempt: { attemptId: string; topicId: string }) {
  return `/mock/review/${attempt.topicId}?attempt=${encodeURIComponent(attempt.attemptId)}`;
}
