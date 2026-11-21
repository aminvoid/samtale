"use client";

import { useTranslations } from "next-intl";
import { useId, type ReactNode } from "react";
import { DanishText } from "@/components/ui/danish-text";
import { PlaybackError } from "@/components/ui/playback-error";
import { RoleHeader } from "@/components/ui/role-header";
import { ToggleIconButton } from "@/components/ui/toggle-icon-button";
import { useClip } from "@/lib/audio/player";
import type { GuideExaminerLine } from "./examiner-lines";

type ExaminerLinePlaybackProps = {
  line: GuideExaminerLine;
  heading: string;
  meaning: string;
  source: ReactNode;
};

export function ExaminerLinePlayback({ line, heading, meaning, source }: ExaminerLinePlaybackProps) {
  const t = useTranslations("guide.lines");
  const audio = useTranslations("audio");
  const clip = useClip(line.id, line.audio);
  const transcriptId = useId();
  const errorId = useId();
  const playing = clip.status === "playing";
  const failed = clip.status === "error";
  const togglePlayback = () => {
    if (playing) clip.pause();
    else clip.play();
  };

  return (
    <div className="rounded-card bg-role-examiner-subtle p-4">
      <RoleHeader
        role="examiner-line"
        as="h3"
        label={heading}
        action={
          clip.unavailable ? undefined : (
            <ToggleIconButton
              label={t("play", { meaning })}
              icon={failed ? "rotate-ccw" : "play"}
              pressedIcon="pause"
              pressed={playing}
              loading={clip.status === "loading"}
              aria-describedby={failed ? `${transcriptId} ${errorId}` : transcriptId}
              onClick={togglePlayback}
              className="shrink-0 rounded-full border-role-examiner/30 bg-role-examiner-subtle text-role-examiner hover:bg-surface-raised hover:text-role-examiner aria-pressed:border-role-examiner"
            />
          )
        }
      />
      <div className="mbs-1">{source}</div>
      <DanishText id={transcriptId} as="p" className="mbs-2 text-da-line">
        {line.text}
      </DanishText>
      <p lang="fa" className="mbs-2 text-ui">
        {t("translation", { meaning })}
      </p>
      {clip.unavailable && <p className="text-caption text-text-muted">{t("missing")}</p>}
      <PlaybackError id={errorId}>{failed ? audio("playbackFailed") : null}</PlaybackError>
    </div>
  );
}
