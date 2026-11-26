"use client";

import { useTranslations } from "next-intl";
import { Button } from "./button";
import { IconVolume2 } from "./icon";

type TapToHearProps = {
  onClick: () => void;
  label?: string;
  className?: string;
};

/** Pass a synchronous handler so the next playback call has user activation. */
export function TapToHear({ onClick, label, className }: TapToHearProps) {
  const t = useTranslations("audio");
  return (
    <Button size="lg" icon={<IconVolume2 />} block onClick={onClick} className={className}>
      {label ?? t("tapToHear")}
    </Button>
  );
}
