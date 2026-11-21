"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Disclosure } from "@/components/ui/disclosure";
import { InfoNote } from "@/components/ui/info-note";
import type { TopicStudyState } from "@/lib/progress/derive";
import { localDateOf, type ReviewSchedule } from "@/lib/progress/review-schedule";
import { getStudyProgressStore } from "./study-progress-store";

function calendarDate(day: string) {
  return new Date(`${day}T00:00:00Z`);
}

export function StudyVisit({ topicId, children }: { topicId: string; children: ReactNode }) {
  const t = useTranslations("study");
  const format = useFormatter();
  const layoutChosen = useRef(false);
  const [layoutOpen, setLayoutOpen] = useState(true);
  const [progress, setProgress] = useState<{
    study: TopicStudyState;
    review: ReviewSchedule | undefined;
    today: string;
  }>();

  useEffect(() => {
    const store = getStudyProgressStore();
    const openedAt = new Date();
    let active = true;
    let revision = 0;

    async function visit() {
      const previous = await store.getLastOpened();
      if (!active) return;
      if (!layoutChosen.current && previous.ok && previous.value !== null) setLayoutOpen(false);
      await store.setLastOpened({ topicId, openedAt: openedAt.toISOString() });
    }

    async function refresh() {
      const current = ++revision;
      const [availability, study, schedules] = await Promise.all([
        store.availability(),
        store.getTopicStudyState(topicId),
        store.listReviewSchedule(),
      ]);
      if (!active || current !== revision) return;
      setProgress(
        availability.kind === "available" && study.ok && study.value !== null
          ? {
              study: study.value,
              review: schedules.ok
                ? schedules.value.find((schedule) => schedule.topicId === topicId)
                : undefined,
              today: localDateOf(new Date()),
            }
          : undefined,
      );
    }

    const update = () => void refresh().catch(() => undefined);
    const unsubscribe = store.subscribe(update);
    void visit().catch(() => undefined);
    update();
    return () => {
      active = false;
      unsubscribe();
    };
  }, [topicId]);

  function relativeDate(date: string) {
    return progress === undefined
      ? ""
      : format.relativeTime(calendarDate(date), {
          now: calendarDate(progress.today),
          unit: "day",
        });
  }

  const nextReview = progress?.review?.nextReview;

  return (
    <div className="grid gap-3">
      {progress !== undefined && (
        <p className="text-caption text-text-muted">
          {t("practiceStatus", {
            count: progress.study.practiceCount,
            when: relativeDate(progress.study.lastPractisedOn),
          })}
        </p>
      )}
      {progress !== undefined && nextReview && (
        <InfoNote icon="clock-3">
          {nextReview.dueDate <= progress.today
            ? t("reviewDue", { day: nextReview.day })
            : t("reviewNext", { when: relativeDate(nextReview.dueDate) })}
        </InfoNote>
      )}
      {nextReview === null && <InfoNote icon="clock-3">{t("reviewComplete")}</InfoNote>}
      <Disclosure
        className="rounded-card bg-accent-subtle p-3"
        label={t("layoutTitle")}
        icon="info"
        open={layoutOpen}
        onOpenChange={(open) => {
          layoutChosen.current = true;
          setLayoutOpen(open);
        }}
      >
        {children}
      </Disclosure>
    </div>
  );
}
