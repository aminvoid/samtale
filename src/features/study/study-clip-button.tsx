"use client";

import { useTranslations } from "next-intl";
import { PlayButton } from "@/components/ui/play-button";
import { useClip } from "@/lib/audio/player";
import type { ContentItem } from "@/lib/content/repository";

type StudyClip = { id: string; audio?: Pick<NonNullable<ContentItem["audio"]>, "url" | "durationMs"> };

type StudyClipButtonProps = {
  item: StudyClip;
  label: string;
  variant: "examiner" | "model" | "neutral";
};

export function StudyClipButton({ item, label, variant }: StudyClipButtonProps) {
  const t = useTranslations("audio");
  const clip = useClip(item.id, item.audio);

  if (clip.unavailable) return <p className="text-caption text-text-muted">{t("unavailable")}</p>;

  return (
    <PlayButton
      label={label}
      status={clip.status}
      variant={variant}
      onClick={clip.status === "playing" ? clip.pause : clip.play}
    />
  );
}
