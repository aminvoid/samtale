"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { IconCirclePause } from "@/components/ui/icon";
import { DismissibleInfoNote } from "@/components/ui/dismissible-info-note";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils/cn";
import { useMockSession } from "../runner/adapters/mock-session-provider";
import { reviewHref, useMockHandoff } from "./mock-handoff";
import { mockLink, mockSecondaryLink } from "./presentation";

export function MockStartNotice() {
  const { destination, setDestination } = useMockHandoff();
  const { recordings } = useMockSession();
  const t = useTranslations();
  const [failedId, setFailedId] = useState<string>();
  const attemptId = destination?.attempt?.attemptId;
  const saveResult = destination?.saveResult;

  useEffect(() => {
    let active = true;
    void saveResult?.then((result) => {
      if (active && !result.ok) setFailedId(attemptId);
    });
    return () => {
      active = false;
    };
  }, [attemptId, saveResult]);

  if (destination?.to !== "mock" || !destination.noticeKey) return null;
  const { attempt } = destination;
  const key =
    failedId !== undefined && failedId === attemptId ? "mock.back.unsavedAttempt" : destination.noticeKey;

  return (
    <DismissibleInfoNote
      icon={IconCirclePause}
      dismissLabel={t("mock.close")}
      onDismiss={() => {
        if (attempt) recordings.discardAttempt(attempt.attemptId);
        setDestination(null);
      }}
    >
      <p>{t(key)}</p>
      {attempt && (
        <Link
          className={cn(mockLink, mockSecondaryLink, "mbs-2")}
          href={reviewHref(attempt)}
          prefetch={false}
        >
          {t("mock.review.see")}
        </Link>
      )}
    </DismissibleInfoNote>
  );
}
