"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { AudioPlayer } from "@/components/ui/audio-player";
import { useAudioPlayer } from "@/lib/audio/player";
import type { RecordingAnswer } from "@/lib/progress/schema";

/** A recorded take plus an object URL whose lifetime the review screen owns. */
export type ReviewTakeSource = RecordingAnswer & { readonly url: string };

export function ReviewTake({ take, part, role }: { take: ReviewTakeSource; part: number; role: string }) {
  const t = useTranslations("mock.review");
  const player = useAudioPlayer();
  const itemId = `take:${take.itemId}:${String(part)}`;
  useEffect(
    () => () => {
      // The URL is revoked by its owner; stop playback first so the player never holds a dead source.
      if (player.getSnapshot().clipId === itemId) player.stop();
    },
    [itemId, player],
  );

  return (
    <AudioPlayer
      key={take.url}
      itemId={itemId}
      label={t("playTake", { role, part })}
      audio={{ url: take.url, durationMs: take.durationMs }}
      className="bg-surface-raised"
    />
  );
}
