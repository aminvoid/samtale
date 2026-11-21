import type { MockDeck } from "@/lib/content/repository";
import type { MockExamSetup } from "../index";

export type DeckTopic = MockDeck["topics"][number];
export type ThemeOption = { id: string; title: string };

export function formatDuration(ms: number, clock: (values: { minutes: number; seconds: number }) => string) {
  const seconds = Math.floor(Math.max(0, ms) / 1000);
  return clock({ minutes: Math.floor(seconds / 60), seconds: seconds % 60 });
}

export function practiceSource(
  topics: readonly DeckTopic[],
  topicId: string | null,
  themeId: string | null,
): { source: NonNullable<MockExamSetup["options"]>["topicSource"]; invalid: boolean } {
  if (topicId !== null && topics.some(({ id }) => id === topicId))
    return { source: { type: "chosen", topicId }, invalid: false };
  if (topicId === null && themeId !== null && topics.some((topic) => topic.themeId === themeId))
    return { source: { type: "drawFromTheme", themeId }, invalid: false };
  return { source: { type: "draw" }, invalid: topicId !== null || themeId !== null };
}

export const mockLink =
  "inline-flex items-center justify-center rounded-control px-4 py-2 text-center font-semibold min-block-touch";
export const mockPrimaryLink = "bg-accent text-accent-contrast hover:bg-accent-hover";
export const mockSecondaryLink =
  "border border-border-strong bg-surface-raised text-text hover:bg-surface-sunken";
export const mockCard = "rounded-card border border-border bg-surface-raised p-4 md:p-6";
export const mockTextLink = "inline-flex items-center py-2 text-accent underline min-block-touch";
