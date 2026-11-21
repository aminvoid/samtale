import { examConfig } from "@/lib/exam/config";
import type { Clip, MockPrompt, MockTopic, QuestionUnit, SituationKey, Unit } from "./types";

const writtenAlternatives = /Hvorfor\??\s*\/\s*hvorfor ikke\?$/iu;

export const introClip = (topicId: string): Clip => ({
  id: `${examConfig.examinerLineIds.intro}:${topicId}`,
});
export const thanksClip: Clip = { id: examConfig.examinerLineIds.thanks };
export const closingClip: Clip = { id: examConfig.examinerLineIds.closing };

function promptClip(prompt: MockPrompt): Clip {
  return { id: prompt.id, textDa: prompt.text.da };
}

function followupClip(prompt: MockPrompt): Clip {
  const clip = promptClip(prompt);
  const spoken = prompt.spoken;
  const [question, ending] = spoken?.parts ?? [];
  if (spoken && question && ending) {
    return { ...clip, spoken: { question, ending, pauseMs: spoken.pauseMs } };
  }
  if (!writtenAlternatives.test(prompt.text.da)) return clip;
  const firstPart = prompt.siriCheck?.siriParts?.[0];
  return {
    ...clip,
    spoken: {
      question:
        firstPart && !writtenAlternatives.test(firstPart)
          ? firstPart
          : prompt.text.da.replace(writtenAlternatives, "").trimEnd(),
      // The existing audio pipeline inserts a 800 ms break in this asset.
      pauseMs: 800,
      ending: "Hvorfor eller hvorfor ikke?",
    },
  };
}

export function buildDelproeve2Script(topic: MockTopic, situationKey: SituationKey): readonly Unit[] {
  const situation = topic.situations.find(({ key }) => key === situationKey);
  if (!situation) return [];
  const q1 = promptClip(situation.question);
  const q2 = promptClip(topic.general.question);
  return [
    { role: "intro", clips: [introClip(topic.id)] },
    { role: "firstRequired", id: q1.id, clips: [promptClip(situation.intro), q1], question: q1 },
    ...followups(situation.followups, "firstFollowup"),
    {
      role: "secondRequired",
      id: q2.id,
      clips: [{ id: examConfig.examinerLineIds.transition }, q2],
      question: q2,
    },
    ...followups(topic.general.followups, "secondFollowup"),
    { role: "closing", clips: [closingClip] },
  ];
}

function followups(prompts: readonly MockPrompt[], role: QuestionUnit["role"]): QuestionUnit[] {
  return prompts.map((prompt) => {
    const question = followupClip(prompt);
    return { role, id: question.id, clips: [question], question };
  });
}

export function preloadClipIds(topic: MockTopic): readonly string[] {
  const ids = topic.situations.flatMap(({ key }) =>
    buildDelproeve2Script(topic, key).flatMap(({ clips }) => clips.map(({ id }) => id)),
  );
  return [...new Set([...ids, thanksClip.id])];
}
