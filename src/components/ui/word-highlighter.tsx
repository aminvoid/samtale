"use client";

import type { ComponentProps } from "react";
import type { WordTiming } from "@/lib/audio/manifest-schema";
import { useWordHighlight, type ClipStatus } from "@/lib/audio/player";
import { DanishText } from "./danish-text";

type WordHighlighterProps = Omit<ComponentProps<typeof DanishText>, "children"> & {
  text: string;
  words?: readonly WordTiming[];
  currentTimeMs: number;
  status: ClipStatus;
  enabled?: boolean;
};

export function WordHighlighter({
  text,
  words,
  currentTimeMs,
  status,
  enabled = true,
  ...props
}: WordHighlighterProps) {
  const active = enabled && (status === "playing" || status === "paused");
  const range = useWordHighlight(words, active ? currentTimeMs : null);

  return (
    <DanishText {...props}>
      {range === null || range.end > text.length ? (
        text
      ) : (
        <>
          {text.slice(0, range.start)}
          <span className="-mx-0.5 bg-highlight box-decoration-clone px-0.5 underline decoration-role-keyword decoration-2 underline-offset-3">
            {text.slice(range.start, range.end)}
          </span>
          {text.slice(range.end)}
        </>
      )}
    </DanishText>
  );
}
