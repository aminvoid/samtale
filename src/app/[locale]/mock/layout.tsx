import type { ReactNode } from "react";
import { MockSessionProvider } from "@/features/mock-exam";
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
