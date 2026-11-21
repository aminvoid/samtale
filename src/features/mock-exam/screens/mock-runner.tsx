"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useClip } from "@/lib/audio/player";
import type { MockDeck } from "@/lib/content/repository";
import { examConfig } from "@/lib/exam/config";
import {
  useBrowserMockExamPorts,
  useMockExam,
  useMockSession,
  type MockExamPorts,
  type MockExamSetup,
  type Mode,
} from "../index";
import { DrawReveal } from "./draw-reveal";
import { FocusedRun } from "./focused-run";
import { GetReady } from "./get-ready";
import { MockAnnouncements, type MockAnnouncement } from "./mock-announcements";
import { reviewHref, useMockHandoff } from "./mock-handoff";
import { practiceSource, type ThemeOption } from "./presentation";

export function MockRunner({
  deck,
  themes,
  mode,
}: {
  deck: MockDeck;
  themes: readonly ThemeOption[];
  mode: Mode;
}) {
  const query = useSearchParams();
  const options =
    mode === "practice"
      ? practiceSource(deck.topics, query.get("topic"), query.get("theme"))
      : practiceSource(deck.topics, null, null);
  const router = useRouter();
  const { destination, setDestination } = useMockHandoff();
  const { recordings } = useMockSession();
  const pending = useRef<MockAnnouncement[]>([]);
  const [messages, setMessages] = useState<MockAnnouncement[]>([]);
  const [revision, setRevision] = useState(0);
  const ports = useBrowserMockExamPorts(deck, {
    announce(message) {
      pending.current.push(message);
      if (pending.current.length !== 1) return;
      queueMicrotask(() => {
        setMessages(pending.current);
        pending.current = [];
        setRevision((value) => value + 1);
      });
    },
    navigate(next) {
      const previous = destination?.attempt;
      if (previous && previous.attemptId !== next.attempt?.attemptId)
        recordings.discardAttempt(previous.attemptId);
      setDestination(next);
      if (next.to === "review") router.push(reviewHref(next.attempt));
      else router.replace("/mock");
    },
  });
  const sound = deck.examinerLines.find(({ id }) => id === examConfig.soundCheckClipId);
  const clip = useClip(examConfig.soundCheckClipId, sound?.audio);
  const setup = { mode, topics: deck.topics, options: { topicSource: options.source } };
  return (
    <>
      <RunnerScreens
        key={`${mode}:${query.toString()}`}
        deck={deck}
        themes={themes}
        setup={setup}
        ports={ports}
        invalid={options.invalid}
        soundError={clip.status === "error" || clip.unavailable}
      />
      <MockAnnouncements revision={revision} messages={messages} deck={deck} />
    </>
  );
}

export function RunnerScreens({
  deck,
  themes,
  setup,
  ports,
  invalid = false,
  soundError = false,
}: {
  deck: MockDeck;
  themes: readonly ThemeOption[];
  setup: MockExamSetup;
  ports: MockExamPorts;
  invalid?: boolean;
  soundError?: boolean;
}) {
  const t = useTranslations("mock");
  const { state, send, now, preloadProgress, micPreviouslyDenied } = useMockExam(setup, ports);
  if (state === null || state.type === "left") return <h1 className="text-h1">{t(`ready.${setup.mode}`)}</h1>;
  if (state.type === "prepare.getReady" || state.type === "prepare.instruction")
    return <GetReady {...{ state, send, deck, themes, invalid, soundError, micPreviouslyDenied }} />;
  if (state.type === "prepare.draw" || state.type === "prepare.reveal")
    return <DrawReveal {...{ state, send, deck, preloadProgress }} />;
  return <FocusedRun {...{ state, send, now, deck }} />;
}
