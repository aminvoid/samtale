"use client";

import { useMemo } from "react";
import type { WordTiming } from "../manifest-schema";
import { findActiveWord } from "./find-active-word";

export function useWordHighlight(words: readonly WordTiming[] | undefined, currentTimeMs: number | null) {
  return useMemo(() => findActiveWord(words, currentTimeMs), [words, currentTimeMs]);
}
