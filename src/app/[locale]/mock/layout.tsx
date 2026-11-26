import type { ReactNode } from "react";
// Imported from its own file: the feature index pulls the runner (and Zod) into the start page and its prefetch.
import { MockSessionProvider } from "@/features/mock-exam/runner/adapters/mock-session-provider";
import { MockHandoff } from "@/features/mock-exam/screens/mock-handoff";
import { AudioPlayerProvider } from "@/lib/audio/player";

export default function MockLayout({ children }: { children: ReactNode }) {
  return (
    <MockSessionProvider>
      <MockHandoff>
        <AudioPlayerProvider>{children}</AudioPlayerProvider>
      </MockHandoff>
    </MockSessionProvider>
  );
}
