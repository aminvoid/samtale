import { vi } from "vitest";
import type { ExaminerLines, MockDeck, Topic } from "@/lib/content/repository";
import { examConfig } from "@/lib/exam/config";
import { SettingsSchema } from "@/lib/progress/schema";
import type { AudioPort, MockExamPorts, VisibilityPort } from "../index";

const da = "Et eksempel";
const fa = "یک نمونه";
const audio = { url: "/audio/example.mp3", durationMs: 1000 };
const text = { da, fa };

type FixtureSituation = Topic["situations"][number] & Required<Pick<Topic["situations"][number], "intro">>;
type FixtureTopic = Omit<Topic, "situations"> & { situations: [FixtureSituation, FixtureSituation] };

function topic(letter: Topic["letter"]): FixtureTopic {
  const termId = "2024-maj";
  const id = `${termId}-${letter.toLowerCase()}`;
  function section(key: string): Topic["general"] {
    const sectionId = `${id}.${key}`;
    return {
      id: sectionId,
      question: {
        id: `${sectionId}.q`,
        text,
        audio,
        verification: { status: "unchecked" },
        modelAnswer: { id: `${sectionId}.answer`, text: { da }, audio, emphasis: [] },
        keywords: [],
      },
      followups: [],
      personalExamples: [],
    };
  }
  function situation(key: "A" | "B") {
    const questions = section(`sit${key}`);
    return {
      ...questions,
      key,
      title: text,
      intro: {
        id: `${questions.id}.intro`,
        text: { da },
        audio,
        origin: "siri",
        sourceLabel: { kind: "siri", termId },
      },
    } satisfies Topic["situations"][number];
  }
  return {
    id,
    termId,
    term: { year: 2024, session: "maj" },
    letter,
    themeId: "test",
    title: text,
    formatEraId: "from-2023",
    sourcePages: [1],
    links: [],
    examinerAudio: [{ lineId: examConfig.examinerLineIds.intro, audio }],
    situations: [situation("A"), situation("B")],
    general: section("general"),
  };
}

export const examTopics = [topic("A"), topic("B"), topic("C")];
export const examinerLines: ExaminerLines = [
  {
    id: examConfig.soundCheckClipId,
    text: { da: examConfig.soundCheckText },
    audio,
    role: "sound-check",
    origin: "app",
    placeholders: [],
  },
  {
    id: examConfig.examinerLineIds.intro,
    text: { da: "{topic}" },
    role: "intro",
    origin: "siri",
    placeholders: ["topic"],
  },
  {
    id: examConfig.examinerLineIds.transition,
    text: { da },
    audio,
    role: "transition",
    origin: "app",
    placeholders: [],
  },
  {
    id: examConfig.examinerLineIds.thanks,
    text: { da: "Tak." },
    audio,
    role: "between-answers",
    origin: "app",
    placeholders: [],
  },
  {
    id: examConfig.examinerLineIds.closing,
    text: { da: "Tak, så er prøven forbi." },
    audio,
    role: "closing",
    origin: "siri",
    placeholders: [],
  },
];

export const testDeck: MockDeck = {
  terms: [],
  examinerLines,
  topics: examTopics,
};

export function screenPorts() {
  let position = 1_700_000_000_000;
  let alarm: { at: number; run: () => void } | undefined;
  let signal: Parameters<AudioPort["play"]>[2] | undefined;
  let visibility: Parameters<VisibilityPort["subscribe"]>[0] | undefined;
  const ports = {
    audio: {
      preload: vi.fn<AudioPort["preload"]>().mockResolvedValue(undefined),
      play: vi.fn<AudioPort["play"]>().mockImplementation((_, __, listener) => {
        signal = listener;
        listener("started");
      }),
      stop: vi.fn(),
      pause: vi.fn(),
      releaseAssets: vi.fn(),
    },
    recorder: {
      requestMic: vi.fn<MockExamPorts["recorder"]["requestMic"]>().mockResolvedValue({ type: "granted" }),
      start: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      stop: vi.fn<MockExamPorts["recorder"]["stop"]>().mockResolvedValue(null),
      discard: vi.fn(),
      release: vi.fn(),
      subscribe: () => () => undefined,
    },
    clock: {
      now: () => position,
      setTimeout(run, delay) {
        const scheduled = { at: position + delay, run };
        alarm = scheduled;
        return () => {
          if (alarm === scheduled) alarm = undefined;
        };
      },
    },
    progress: {
      getSettings: vi
        .fn<MockExamPorts["progress"]["getSettings"]>()
        .mockResolvedValue({ ok: true, value: SettingsSchema.parse({}) }),
      savePreference: vi.fn<MockExamPorts["progress"]["savePreference"]>().mockResolvedValue({ ok: true }),
      persistAttempt: vi.fn<MockExamPorts["progress"]["persistAttempt"]>().mockResolvedValue({ ok: true }),
    },
    marker: {
      read: vi.fn<MockExamPorts["marker"]["read"]>().mockResolvedValue({ ok: true, value: null }),
      write: vi.fn<MockExamPorts["marker"]["write"]>().mockResolvedValue({ ok: true }),
      clear: vi.fn<MockExamPorts["marker"]["clear"]>().mockResolvedValue({ ok: true }),
    },
    wakeLock: {
      acquire: vi.fn<MockExamPorts["wakeLock"]["acquire"]>().mockResolvedValue("held"),
      release: vi.fn(),
    },
    visibility: {
      armBackGuard: vi.fn(),
      disarmBackGuard: vi.fn(),
      isVisible: () => true,
      subscribe(listener) {
        visibility = listener;
        return () => {
          visibility = undefined;
        };
      },
    },
    announce: { emit: vi.fn() },
    recordings: { collect: vi.fn(), discardAnswer: vi.fn(), discardAttempt: vi.fn() },
    navigate: vi.fn<MockExamPorts["navigate"]>(),
  } satisfies MockExamPorts;
  return {
    ports,
    signal: (value: Parameters<NonNullable<typeof signal>>[0]) => {
      signal?.(value);
    },
    page: (value: Parameters<NonNullable<typeof visibility>>[0]) => {
      visibility?.(value);
    },
    advance(ms: number) {
      const until = position + ms;
      while (alarm && alarm.at <= until) {
        position = alarm.at;
        const run = alarm.run;
        alarm = undefined;
        run();
      }
      position = until;
    },
  };
}
