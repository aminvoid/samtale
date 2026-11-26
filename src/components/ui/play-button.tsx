"use client";

import { useTranslations } from "next-intl";
import { useId } from "react";
import type { ClipStatus } from "@/lib/audio/player";
import { cn } from "@/lib/utils/cn";
import { IconPause, IconPlay, IconRotateCcw } from "./icon";
import { PlaybackError } from "./playback-error";
import { ToggleIconButton } from "./toggle-icon-button";

const variants = {
  examiner:
    "border-role-examiner/30 bg-role-examiner-subtle text-role-examiner aria-pressed:border-role-examiner hover:bg-role-examiner-subtle hover:text-role-examiner active:bg-role-examiner-subtle",
  model:
    "bg-role-sample-subtle text-role-sample aria-pressed:border-role-sample hover:bg-role-sample-subtle hover:text-role-sample active:bg-role-sample-subtle",
  neutral: "bg-accent-subtle text-accent hover:bg-accent-subtle hover:text-accent active:bg-accent-subtle",
  primary:
    "bg-accent text-accent-contrast aria-pressed:border-accent-contrast hover:bg-accent hover:text-accent-contrast active:bg-accent",
};

type PlayButtonProps = {
  label?: string;
  status: ClipStatus;
  onClick: () => void;
  variant?: keyof typeof variants;
  showLabel?: boolean;
  disabled?: boolean;
  errorId?: string;
  className?: string;
};

/** errorId associates the button with a playback error rendered elsewhere in its row. */
export function PlayButton({
  label,
  status,
  onClick,
  variant = "neutral",
  showLabel = false,
  disabled = false,
  errorId,
  className,
}: PlayButtonProps) {
  const t = useTranslations("audio");
  const localErrorId = useId();
  const defaultLabel =
    variant === "examiner" ? t("playExaminer") : variant === "model" ? t("playModel") : t("play");
  return (
    <div className={cn("inline-flex flex-wrap items-center gap-2", className)}>
      <ToggleIconButton
        label={label ?? defaultLabel}
        icon={status === "error" ? <IconRotateCcw /> : <IconPlay />}
        pressed={status === "playing"}
        pressedIcon={<IconPause />}
        loading={status === "loading"}
        disabled={disabled}
        onClick={onClick}
        aria-describedby={status === "error" ? (errorId ?? localErrorId) : undefined}
        className={cn(
          "shrink-0 rounded-full enabled:hover:brightness-95 dark:enabled:hover:brightness-110",
          disabled ? undefined : variants[variant],
        )}
      />
      {showLabel && <span className="text-caption">{t("play")}</span>}
      {errorId === undefined && (
        <PlaybackError id={localErrorId}>{status === "error" ? t("playbackFailed") : null}</PlaybackError>
      )}
    </div>
  );
}
