"use client";

import { createContext, useEffect, useState, type ReactNode } from "react";
import type { TopicStudyState } from "@/lib/progress/derive";

type ProgressSnapshot = {
  studied: ReadonlyMap<string, TopicStudyState>;
  due: ReadonlySet<string>;
  today: number;
};

export const LibraryProgressContext = createContext<ProgressSnapshot | null>(null);

export function LibraryProgress({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<ProgressSnapshot | null>(null);

  useEffect(() => {
    const lifetime = new AbortController();
    const isActive = () => !lifetime.signal.aborted;
    let unsubscribe: (() => void) | undefined;

    async function start() {
      const { createProgressStore } = await import("@/lib/progress/create-progress-store");
      if (!isActive()) return;
      const store = createProgressStore();
      if ((await store.availability()).kind !== "available" || !isActive()) return;

      let revision = 0;
      async function read() {
        const reading = ++revision;
        const [studied, due] = await Promise.all([store.listTopicStudyStates(), store.listDueReviews()]);
        if (!isActive() || reading !== revision) return;
        if (!studied.ok || !due.ok) {
          setProgress(null);
          return;
        }
        const now = new Date();
        setProgress({
          studied: new Map(studied.value.map((state) => [state.topicId, state])),
          due: new Set(due.value.map(({ topicId }) => topicId)),
          today: Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()),
        });
      }

      function refresh() {
        void read().catch(() => {
          if (isActive()) setProgress(null);
        });
      }

      unsubscribe = store.subscribe(refresh);
      refresh();
    }

    void start().catch(() => {
      if (isActive()) setProgress(null);
    });

    return () => {
      lifetime.abort();
      unsubscribe?.();
    };
  }, []);

  return <LibraryProgressContext value={progress}>{children}</LibraryProgressContext>;
}
