"use client";

import { useTranslations } from "next-intl";
import { PlayButton } from "@/components/ui/play-button";
import { useClip } from "@/lib/audio/player";
import type { ContentItem } from "@/lib/content/repository";

export type StudyClip = { id: string; audio?: Pick<NonNullable<ContentItem["audio"]>, "url" | "durationMs"> };

type StudyClipButtonProps = {
  item: StudyClip;
  label: string;
  variant: "examiner" | "model" | "neutral";
  onPlay?: () => void;
};

export function StudyClipButton({ item, label, variant, onPlay }: StudyClipButtonProps) {
  const t = useTranslations("audio");
  const clip = useClip(item.id, item.audio);

  if (clip.unavailable) return <p className="text-caption text-text-muted">{t("unavailable")}</p>;

  return (
    <PlayButton
      label={label}
      status={clip.status}
      variant={variant}
      onClick={() => {
        if (clip.status === "playing") {
          clip.pause();
        } else {
          clip.play();
          onPlay?.();
        }
      }}
    />
  );
}
