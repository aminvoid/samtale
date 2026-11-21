import { z } from "zod";

const seconds = z.number().int().positive();
const clipId = z.string().min(1);

export const examConfigSchema = z
  .object({
    lookSeconds: seconds,
    examLimitSeconds: seconds,
    graceSeconds: seconds,
    answerGuideSeconds: z.tuple([seconds, seconds]),
    maxRecordingSeconds: seconds,
    slowLoadNoticeSeconds: seconds,
    lookExtendSeconds: seconds,
    examinerGapMs: z.number().int().nonnegative(),
    oneMinuteNoticeSeconds: seconds,
    pacingAid: z.object({
      part1Seconds: seconds,
      part2Seconds: seconds,
      enabled: z.boolean(),
      expanded: z.boolean(),
    }),
    examinerLineIds: z.object({
      intro: clipId,
      transition: clipId,
      thanks: clipId,
      closing: clipId,
    }),
    repeatRequestText: z.string().min(1),
    soundCheckClipId: clipId,
    soundCheckText: z.string().min(1),
    instructionLineId: clipId.nullable(),
    examClockStartsAt: z.literal("situationIntroStarted"),
    defaultTimersVisible: z.boolean(),
    part1CutoffSeconds: seconds,
    micMuteInterruptMs: z.number().int().positive(),
    backBehaviour: z.enum(["leaveDialog", "endEarly"]),
    slowRepeatRate: z.number().positive().lt(1),
    part1HandoverSeconds: seconds,
    graceCeilingSeconds: seconds,
  })
  .refine((config) => config.answerGuideSeconds[0] <= config.answerGuideSeconds[1])
  .refine((config) => config.oneMinuteNoticeSeconds < config.examLimitSeconds)
  .refine(
    (config) =>
      config.part1CutoffSeconds < config.part1HandoverSeconds &&
      config.part1HandoverSeconds < config.examLimitSeconds &&
      config.examLimitSeconds < config.graceCeilingSeconds,
  );

/** Exam config (DL-039). Source: mock exam state-machine spec §2. */
export const examConfig = examConfigSchema.parse({
  lookSeconds: 10, // C1
  examLimitSeconds: 270, // C2
  graceSeconds: 20, // C3
  answerGuideSeconds: [45, 60], // C4
  maxRecordingSeconds: 180, // C5
  slowLoadNoticeSeconds: 15, // C6
  lookExtendSeconds: 10, // C7
  examinerGapMs: 600, // C8
  oneMinuteNoticeSeconds: 60, // C9
  pacingAid: { part1Seconds: 120, part2Seconds: 150, enabled: false, expanded: false }, // C10
  examinerLineIds: {
    // C11
    intro: "examiner.intro",
    transition: "examiner.transition",
    thanks: "examiner.thanks",
    closing: "examiner.closing",
  },
  repeatRequestText: "Undskyld, vil du godt gentage spørgsmålet?", // C12 (DL-051)
  soundCheckClipId: "examiner.soundCheck", // C13 (UX-OQ-10)
  soundCheckText: "Hej, og velkommen til prøven.", // C13 (reviewed wording)
  instructionLineId: null, // C14 (US-069, until the line is authored)
  examClockStartsAt: "situationIntroStarted", // C15
  defaultTimersVisible: true, // C16
  part1CutoffSeconds: 150, // C17
  micMuteInterruptMs: 1000, // C18
  backBehaviour: "endEarly", // C19 (fallback until the OQ-9 device spike validates the guard)
  slowRepeatRate: 0.75, // C20
  part1HandoverSeconds: 200, // C21
  graceCeilingSeconds: 330, // C22
});
