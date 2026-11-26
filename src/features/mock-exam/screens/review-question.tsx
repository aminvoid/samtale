"use client";

import { useTranslations } from "next-intl";
import { useState, useSyncExternalStore } from "react";
import { AudioPlayer } from "@/components/ui/audio-player";
import { DanishText } from "@/components/ui/danish-text";
import { Disclosure } from "@/components/ui/disclosure";
import { IconKeyRound, IconLanguages, IconMicOff } from "@/components/ui/icon";
import { InfoNote } from "@/components/ui/info-note";
import { RoleHeader } from "@/components/ui/role-header";
import { WordHighlighter } from "@/components/ui/word-highlighter";
import { TranslationToggle } from "@/features/study";
import { Link } from "@/i18n/navigation";
import { richTags } from "@/i18n/rich-tags";
import { useClip } from "@/lib/audio/player";
import type { Topic } from "@/lib/content/repository";
import { examConfig } from "@/lib/exam/config";
import { cn } from "@/lib/utils/cn";
import { formatDuration, mockCard, mockTextLink } from "./presentation";
import { ReviewTake, type ReviewTakeSource } from "./review-take";

type Prompt = Topic["general"]["question"] | Topic["general"]["followups"][number];
type Role = "first" | "second" | "followup";

// The review spec opens samples from the 768 px layout onward.
const sampleBreakpoint = "(min-width: 48rem)";
function subscribeToSampleBreakpoint(notify: () => void) {
  const query = window.matchMedia(sampleBreakpoint);
  query.addEventListener("change", notify);
  return () => {
    query.removeEventListener("change", notify);
  };
}
const readSampleBreakpoint = () => window.matchMedia(sampleBreakpoint).matches;
const serverSampleBreakpoint = () => null;

export function ReviewQuestion({
  item,
  role,
  topicId,
  section,
  recordings,
  showTakes,
}: {
  item: Prompt;
  role: Role;
  topicId: string;
  section: string;
  recordings: readonly ReviewTakeSource[];
  showTakes: boolean;
}) {
  const t = useTranslations("mock");
  const study = useTranslations("study");
  const audio = useTranslations("audio");
  const sample = "modelAnswer" in item ? item.modelAnswer : item.answer;
  const clip = useClip(sample.id, sample.audio);
  const label = t(`examiner.${role}`);
  const template = role === "first" ? 1 : role === "second" ? 2 : 3;
  const duration = recordings.reduce((total, part) => total + part.durationMs, 0);
  const wide = useSyncExternalStore<boolean | null>(
    subscribeToSampleBreakpoint,
    readSampleBreakpoint,
    serverSampleBreakpoint,
  );
  const [sampleOpen, setSampleOpen] = useState<boolean>();
  const hasNoTakes = recordings.length === 0;
  // Review questions mount after the attempt's takes resolve. Capture the default once the viewport is known.
  if (sampleOpen === undefined && (hasNoTakes || wide !== null)) {
    setSampleOpen(hasNoTakes || wide === true);
  }

  const samplePanel = (
    <div className="grid gap-3">
      <AudioPlayer itemId={sample.id} audio={sample.audio} label={t("review.playSample")} />
      <WordHighlighter
        as="p"
        className="text-da-answer wrap-anywhere"
        text={sample.text.da}
        words={sample.audio?.words}
        emphasis={sample.emphasis}
        currentTimeMs={clip.currentTimeMs}
        status={clip.status}
      />
      {sample.translation && (
        <TranslationToggle
          text={sample.translation.fa}
          answerLabel={t("review.answerTranslation", { question: label })}
        />
      )}
      <Link
        href={`/templates#template-${String(template)}`}
        className={cn(mockTextLink, "justify-self-start")}
      >
        {study("basedOnTemplate", { number: template })}
      </Link>
    </div>
  );

  return (
    <article className={cn(mockCard, "grid gap-4")}>
      <div className="grid gap-2">
        <RoleHeader
          as="h3"
          role={role === "first" ? "first-question" : role === "second" ? "second-question" : "followup"}
          label={label}
        />
        <DanishText as="p" className="text-da-question wrap-anywhere">
          {item.text.da}
        </DanishText>
        {item.audio && <AudioPlayer itemId={item.id} audio={item.audio} label={t("review.playPrompt")} />}
        <div className="flex flex-wrap items-start gap-2">
          <Disclosure label={t("interview.translation")} icon={<IconLanguages />}>
            <p lang="fa" className="p-2">
              {item.text.fa}
            </p>
          </Disclosure>
          {"keywords" in item && item.keywords.length > 0 && (
            <Disclosure label={t("interview.keywords")} icon={<IconKeyRound />}>
              <ul className="grid gap-1 p-2">
                {item.keywords.map(({ id, text }) => (
                  <li key={id} className="flex flex-wrap gap-2">
                    <DanishText as="bdi">{text.da}</DanishText>
                    <span lang="fa">{text.fa}</span>
                  </li>
                ))}
              </ul>
            </Disclosure>
          )}
        </div>
      </div>
      <div className={cn("grid items-start gap-4", showTakes && "lg:grid-cols-2")}>
        {showTakes && (
          <div className="grid gap-2 rounded-card bg-role-you-subtle p-3 min-inline-0">
            <h4 className="text-h3 text-role-you">{t("review.yourAnswer")}</h4>
            {recordings.length === 0 ? (
              <InfoNote variant="compact" icon={IconMicOff}>
                {t("review.notRecorded")}
              </InfoNote>
            ) : (
              <>
                <p className="text-caption">
                  {t.rich("review.length", {
                    ...richTags,
                    time: formatDuration(duration, (time) => audio("clock", time)),
                  })}
                </p>
                {role !== "followup" && (
                  <p className="text-caption">
                    {t("interview.guide", {
                      min: examConfig.answerGuideSeconds[0],
                      max: examConfig.answerGuideSeconds[1],
                    })}
                  </p>
                )}
                {recordings.length > 1 && (
                  <p className="text-caption">{t("review.parts", { count: recordings.length })}</p>
                )}
                {recordings.map((take, index) => (
                  <ReviewTake key={index} take={take} part={index + 1} role={label} />
                ))}
              </>
            )}
          </div>
        )}
        <Disclosure
          className="rounded-card bg-role-sample-subtle p-3 min-inline-0"
          heading="h4"
          label={role === "followup" ? study("shortAnswer") : t("review.sample")}
          open={sampleOpen ?? false}
          onOpenChange={setSampleOpen}
        >
          {samplePanel}
        </Disclosure>
      </div>
      <Link href={`/topics/${topicId}#${section}`} className={cn(mockTextLink, "justify-self-start")}>
        {t("review.topicLink")}
      </Link>
    </article>
  );
}
