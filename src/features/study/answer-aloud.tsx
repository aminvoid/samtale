"use client";

import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils/cn";
import { getStudyProgressStore } from "./study-progress-store";

export function AnswerAloud({
  topicId,
  itemId,
  primary = false,
}: {
  topicId: string;
  itemId: string;
  primary?: boolean;
}) {
  const t = useTranslations("study");
  const noteId = `answer-${itemId}`;
  const busy = useRef(false);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "review" | "error">("idle");
  const completion =
    status === "saved" ? t("practiceSaved") : status === "review" ? t("reviewSaved") : undefined;

  async function confirmPractice() {
    if (busy.current) return;
    busy.current = true;
    setStatus("saving");
    const store = getStudyProgressStore();
    try {
      const due = await store.listDueReviews();
      const result = await store.recordPractice({ topicId, itemId, kind: "answer-aloud" });
      if (result.ok && (await store.availability()).kind === "available") {
        setStatus(due.ok && due.value.some((review) => review.topicId === topicId) ? "review" : "saved");
        return;
      }
    } catch {
      // Storage may be restricted by the browser.
    }
    busy.current = false;
    setStatus("error");
  }

  return (
    <div className="grid content-start gap-2">
      <a
        href={`#${noteId}`}
        onClick={() => {
          if (completion === undefined || window.location.hash === `#${noteId}`) return;
          busy.current = false;
          setStatus("idle");
        }}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-control border px-4 py-2 text-center text-ui font-semibold",
          primary
            ? "border-transparent bg-accent text-accent-contrast min-block-touch-primary hover:bg-accent-hover xl:min-block-touch"
            : "justify-self-start border-border-strong bg-surface-raised min-block-touch hover:bg-surface-sunken",
        )}
      >
        <Icon name="mic" />
        {t("answerAloud")}
      </a>
      {primary && <p className="text-caption text-text-muted">{t("answerAloudTip")}</p>}
      <div
        id={noteId}
        tabIndex={-1}
        className="hidden gap-2 rounded-control bg-surface-sunken p-3 text-caption target:grid"
      >
        <p>{t("answerComingSoon")}</p>
        <Button
          variant="secondary"
          className="justify-self-start"
          loading={status === "saving"}
          disabledReason={completion}
          onClick={() => void confirmPractice()}
        >
          {t("answerDone")}
        </Button>
        <p role="status" className={status === "error" ? undefined : "sr-only"}>
          {status === "error" ? t("practiceSaveFailed") : completion}
        </p>
      </div>
    </div>
  );
}
