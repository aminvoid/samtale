"use client";

import { Slider } from "@base-ui/react/slider";
import { useTranslations } from "next-intl";
import { useId } from "react";
import { useClip } from "@/lib/audio/player";
import type { AudioRef } from "@/lib/content/schema/published";
import { cn } from "@/lib/utils/cn";
import { DirectionProvider } from "./direction-provider";
import { PlayButton } from "./play-button";
import { PlaybackError } from "./playback-error";
import { SpeedControl } from "./speed-control";

type AudioPlayerProps = {
  itemId: string;
  audio?: AudioRef;
  label: string;
  className?: string;
};

export function AudioPlayer({ itemId, audio, label, className }: AudioPlayerProps) {
  const t = useTranslations("audio");
  const clip = useClip(itemId, audio);
  const errorId = useId();

  function formatTime(ms: number) {
    const seconds = Math.floor(ms / 1000);
    return t("clock", { minutes: Math.floor(seconds / 60), seconds: seconds % 60 });
  }

  const elapsed = formatTime(clip.currentTimeMs);
  const total = clip.durationMs === null ? t("unknownDuration") : formatTime(clip.durationMs);
  const scrubberDisabled = clip.durationMs === null || clip.status === "error";
  // A seek can briefly buffer. Keep focus on the thumb once metadata is available.
  const scrubberBusy = clip.status === "loading";

  return (
    <div className={cn("grid gap-2 rounded-control bg-surface-sunken p-3", className)}>
      <DirectionProvider direction="ltr">
        <div dir="ltr" className="flex items-start gap-3">
          <PlayButton
            label={label}
            status={clip.status}
            onClick={clip.status === "playing" ? clip.pause : clip.play}
            disabled={clip.unavailable}
            variant="primary"
            errorId={errorId}
          />
          <div className="flex-1 px-3 min-inline-0">
            <Slider.Root
              max={Math.max(1, clip.durationMs ?? 0)}
              step={1000}
              largeStep={5000}
              value={clip.currentTimeMs}
              onValueChange={clip.seek}
              disabled={scrubberDisabled}
              aria-disabled={scrubberDisabled || scrubberBusy || undefined}
            >
              <Slider.Control className="group flex items-center min-block-touch">
                <Slider.Track className="relative rounded-full bg-border-strong block-1 inline-full forced-colors:border forced-colors:border-current">
                  <Slider.Indicator className="rounded-full bg-accent" />
                  <Slider.Thumb
                    getAriaLabel={() => t("position")}
                    aria-valuetext={t("positionValue", { elapsed, total })}
                    className="rounded-full bg-accent ring-2 ring-surface-raised block-5 inline-5 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus motion-safe:transition-transform motion-safe:duration-(--duration-fast) motion-safe:group-data-dragging:scale-120 motion-safe:hover:scale-120 forced-colors:border forced-colors:border-current"
                  />
                </Slider.Track>
              </Slider.Control>
            </Slider.Root>
            <div className="flex flex-wrap justify-between gap-x-2 text-caption tabular-nums">
              <bdi dir="ltr">{elapsed}</bdi>
              <bdi dir="ltr">{total}</bdi>
            </div>
          </div>
        </div>
      </DirectionProvider>
      <PlaybackError id={errorId}>
        {clip.status === "error" ? t("loadFailed") : clip.unavailable ? t("unavailable") : null}
      </PlaybackError>
      <SpeedControl rate={clip.rate} onRateChange={clip.setRate} className="justify-self-end" />
    </div>
  );
}
