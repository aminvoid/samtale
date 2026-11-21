"use client";

import { useDirection } from "@base-ui/react/direction-provider";
import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { useTranslations } from "next-intl";
import { useId } from "react";
import type { PlaybackRate } from "@/lib/audio/player";
import { cn } from "@/lib/utils/cn";

const rates: readonly PlaybackRate[] = [0.75, 1, 1.25];

type SpeedControlProps = {
  rate: PlaybackRate;
  onRateChange: (rate: PlaybackRate) => void;
  disabled?: boolean;
  className?: string;
};

export function SpeedControl({ rate, onRateChange, disabled, className }: SpeedControlProps) {
  const t = useTranslations("audio");
  const labelId = useId();
  const direction = useDirection();
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)} dir={direction}>
      <span id={labelId} className="text-label">
        {t("speed")}
      </span>
      <RadioGroup<PlaybackRate>
        aria-labelledby={labelId}
        value={rate}
        onValueChange={onRateChange}
        disabled={disabled}
        className="inline-flex flex-wrap rounded-control border border-border-strong p-0.5 max-inline-full"
      >
        {rates.map((value) => (
          <Radio.Root
            key={value}
            value={value}
            aria-label={t("speedOption", { rate: value })}
            nativeButton
            render={<button type="button" />}
            className="inline-flex items-center justify-center rounded-control px-1 text-ui font-semibold tabular-nums min-block-touch min-inline-touch-primary enabled:hover:bg-surface-raised disabled:text-text-muted data-checked:bg-accent data-checked:text-accent-contrast data-checked:enabled:hover:bg-accent-hover"
          >
            <bdi dir="ltr">{t("speedMultiplier", { rate: value })}</bdi>
          </Radio.Root>
        ))}
      </RadioGroup>
    </div>
  );
}
