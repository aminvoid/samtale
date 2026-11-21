import type { ExaminerLines, Topic } from "@/lib/content/repository";

type Audio = Pick<NonNullable<ExaminerLines[number]["audio"]>, "url" | "durationMs">;

export type GuideExaminerLine = {
  id: string;
  text: string;
  origin: "siri" | "app";
  audio?: Audio;
};

export function prepareExaminerLines(
  lines: ExaminerLines,
  example: Pick<Topic, "title" | "examinerAudio"> | null,
) {
  const intro = lines.find(({ role }) => role === "intro");
  const transition = lines.find(({ role }) => role === "transition");
  const closing = lines.find(({ role }) => role === "closing");

  if (intro === undefined || transition === undefined || closing === undefined) {
    throw new Error("The published exam guide requires the intro, transition and closing lines.");
  }

  const introAudio = example?.examinerAudio.find(({ lineId }) => lineId === intro.id)?.audio;
  return {
    // ABOUT §3.4, review Q3: keep the SIRI wording and substitute the same topic as the existing clip.
    intro: {
      id: intro.id,
      text: intro.text.da.replace("{topic}", example?.title.da ?? "[emne]"),
      origin: intro.origin,
      audio: introAudio,
    },
    transition: {
      id: transition.id,
      text: transition.text.da,
      origin: transition.origin,
      audio: transition.audio,
    },
    closing: { id: closing.id, text: closing.text.da, origin: closing.origin, audio: closing.audio },
    exampleTopic: example?.title.fa,
  };
}

export type GuideExaminerLines = ReturnType<typeof prepareExaminerLines>;
