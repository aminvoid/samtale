"use client";

import { useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";
import { Disclosure } from "@/components/ui/disclosure";
import { StudyClipButton, type StudyClip } from "./study-clip-button";

export function IntroAudio({ item, children }: { item: StudyClip; children: ReactNode }) {
  const t = useTranslations("study");
  const [open, setOpen] = useState(false);

  return (
    <div className="grid justify-items-start gap-2">
      <StudyClipButton
        item={item}
        label={t("playIntro")}
        variant="examiner"
        onPlay={() => {
          setOpen(true);
        }}
      />
      <Disclosure
        className="inline-full"
        label={t("introText")}
        icon="captions"
        open={open}
        onOpenChange={setOpen}
      >
        {children}
      </Disclosure>
    </div>
  );
}
