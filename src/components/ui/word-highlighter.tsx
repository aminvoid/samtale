"use client";

import { Fragment, type ComponentProps } from "react";
import type { WordTiming } from "@/lib/audio/manifest-schema";
import { useWordHighlight, type ClipStatus, type WordRange } from "@/lib/audio/player";
import { DanishText } from "./danish-text";

type WordHighlighterProps = Omit<ComponentProps<typeof DanishText>, "children"> & {
  text: string;
  words?: readonly WordTiming[];
  emphasis?: readonly WordRange[];
  currentTimeMs: number;
  status: ClipStatus;
  enabled?: boolean;
};

export function WordHighlighter({
  text,
  words,
  emphasis = [],
  currentTimeMs,
  status,
  enabled = true,
  ...props
}: WordHighlighterProps) {
  const active = enabled && (status === "playing" || status === "paused");
  const word = useWordHighlight(words, active ? currentTimeMs : null);
  const highlight = word !== null && word.end <= text.length ? word : null;

  function renderSegment(start: number, end: number) {
    if (highlight === null || highlight.start >= end || highlight.end <= start) {
      return text.slice(start, end);
    }

    const from = Math.max(start, highlight.start);
    const to = Math.min(end, highlight.end);
    return (
      <>
        {text.slice(start, from)}
        <span className="-mx-0.5 bg-highlight box-decoration-clone px-0.5 underline decoration-role-keyword decoration-2 underline-offset-3">
          {text.slice(from, to)}
        </span>
        {text.slice(to, end)}
      </>
    );
  }

  const segments = emphasis.map(({ start, end }, index) => {
    const previous = emphasis[index - 1]?.end ?? 0;
    return (
      <Fragment key={start}>
        {renderSegment(previous, start)}
        <strong>{renderSegment(start, end)}</strong>
      </Fragment>
    );
  });

  return (
    <DanishText {...props}>
      {segments}
      {renderSegment(emphasis.at(-1)?.end ?? 0, text.length)}
    </DanishText>
  );
}
