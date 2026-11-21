"use client";

import { useSearchParams } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { BackLink } from "@/components/ui/back-link";
import { Button } from "@/components/ui/button";
import { DanishText } from "@/components/ui/danish-text";
import { Dialog } from "@/components/ui/dialog";
import { InfoNote } from "@/components/ui/info-note";
import { PageHeader } from "@/components/ui/page-header";
import { Switch } from "@/components/ui/switch";
import { TermName } from "@/components/ui/term-name";
import { Link, useRouter } from "@/i18n/navigation";
import type { ExaminerLines, Topic } from "@/lib/content/repository";
import { createProgressStore } from "@/lib/progress/create-progress-store";
import type { SaveResult } from "@/lib/progress/progress-store";
import { createRecordingStore } from "@/lib/progress/recording-store";
import {
  FocusItemSchema,
  StableIdSchema,
  type AttemptRecord,
  type FocusItem,
  type SelfCheckTicks,
} from "@/lib/progress/schema";
import { cn } from "@/lib/utils/cn";
import { useMockSession } from "../index";
import { useMockHandoff } from "./mock-handoff";
import { mockCard, mockLink, mockSecondaryLink, mockTextLink } from "./presentation";
import { ReviewFacts } from "./review-facts";
import { ReviewMaterial } from "./review-material";
import { useReviewNavigation } from "./review-navigation";
import type { ReviewTakeSource } from "./review-take";

type Props = { topic: Topic; lines: ExaminerLines };

export function MockReview(props: Props) {
  const query = useSearchParams();
  const id = StableIdSchema.safeParse(query.get("attempt"));
  return <ReviewAttempt key={id.data ?? ""} {...props} id={id.data} />;
}

function ReviewAttempt({ topic, lines, id }: Props & { id?: string }) {
  const t = useTranslations("mock");
  const nav = useTranslations("nav");
  const format = useFormatter();
  const router = useRouter();
  const { destination } = useMockHandoff();
  const { recordings } = useMockSession();
  const [store] = useState(createProgressStore);
  const [device] = useState(createRecordingStore);
  const [result, setResult] = useState<{
    attempt: AttemptRecord | null;
    takes: readonly ReviewTakeSource[];
    available: boolean;
    fresh: boolean;
  }>();
  const [ticks, setTicks] = useState<SelfCheckTicks>({ first: {}, general: {} });
  const [focus, setFocus] = useState<FocusItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<"keepFailed" | "deleteFailed" | "deleted" | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);
  const writeQueue = useRef(Promise.resolve());
  const stay = useRef<HTMLButtonElement>(null);
  const match = destination?.attempt?.attemptId === id && destination?.attempt?.topicId === topic.id;
  const fallback = match ? destination.attempt : undefined;
  const pendingSave = match ? destination.saveResult : undefined;
  const unkept = result?.attempt?.kept === false && result.takes.length > 0;
  const navigation = useReviewNavigation(unkept);

  useEffect(() => {
    if (id === undefined) return;
    const attemptId = id;
    const run = new AbortController();
    // Object URLs for this attempt's takes are owned here and revoked when the read is superseded.
    const urls: string[] = [];
    // A call, not a property read: TypeScript would otherwise keep the narrowed value across awaits.
    const stale = () => run.signal.aborted;
    async function read() {
      const saved = await pendingSave;
      if (stale()) return;
      const [record, available, kept] = await Promise.all([
        store.getAttempt(attemptId),
        store.availability(),
        device.getAttemptRecordings(attemptId),
      ]);
      if (stale()) return;
      const stored = record.ok && record.value?.topicId === topic.id ? record.value : undefined;
      const attempt: AttemptRecord | null =
        stored ?? (fallback ? { ...fallback, kept: false, focusNextTime: null } : null);
      const keptHere = kept.ok && kept.value?.topicId === topic.id;
      const audio = attempt === null ? null : await recordings.readAttempt(attemptId);
      if (stale()) return;
      const takes = audio?.ok
        ? audio.value.map((take) => {
            const url = URL.createObjectURL(take.blob);
            urls.push(url);
            return { ...take, url };
          })
        : [];
      setTicks(attempt?.selfCheck ?? { first: {}, general: {} });
      setFocus(attempt?.focusNextTime ?? null);
      setResult({
        attempt: attempt && { ...attempt, kept: keptHere },
        takes,
        available: available.kind === "available" && saved?.ok !== false,
        fresh: fallback !== undefined,
      });
    }
    void read();
    return () => {
      run.abort();
      for (const url of urls) URL.revokeObjectURL(url);
    };
  }, [device, fallback, id, pendingSave, recordings, store, topic.id]);

  useLayoutEffect(
    () => () => {
      if (id !== undefined) recordings.discardAttempt(id);
    },
    [id, recordings],
  );

  const attempt = result?.attempt;
  function write(action: () => Promise<SaveResult>) {
    writeQueue.current = writeQueue.current.then(async () => {
      const saved = await action();
      if (!saved.ok) setSaveFailed(true);
    });
  }
  function update(group: keyof SelfCheckTicks, key: FocusItem, checked: boolean) {
    if (!attempt) return;
    const next = { ...ticks, [group]: { ...ticks[group], [key]: checked } };
    setTicks(next);
    if (result.available) write(() => store.updateSelfCheck(attempt.attemptId, next));
  }

  async function keep(next?: string) {
    if (busy || !attempt || !result.available) return;
    setBusy(true);
    setNotice(null);
    const saved = await recordings.keepAttempt(attempt.attemptId, attempt.topicId);
    setBusy(false);
    if (!saved.ok) {
      setNotice("keepFailed");
      return;
    }
    setResult({ ...result, attempt: { ...attempt, kept: true } });
    if (next) router.push(next);
  }

  async function remove() {
    if (busy || !attempt) return;
    setBusy(true);
    const saved = await device.deleteAttemptRecordings(attempt.attemptId);
    if (saved.ok) {
      recordings.discardAttempt(attempt.attemptId);
      await store.setAttemptKept(attempt.attemptId, false);
      setResult({ ...result, attempt: { ...attempt, kept: false }, takes: [] });
    }
    setNotice(saved.ok ? "deleted" : "deleteFailed");
    setBusy(false);
  }

  const loading = id !== undefined && result === undefined;
  const takes = result?.takes ?? [];
  const fromHere = result?.fresh ?? false;
  const showKeep = !!attempt && takes.length > 0;
  return (
    <div className="grid gap-5">
      <PageHeader
        back={<BackLink href="/mock">{nav("mockFull")}</BackLink>}
        title={t("review.title")}
        subtitle={
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <DanishText as="bdi">{topic.title.da}</DanishText>
            <span>{topic.title.fa}</span>
            <TermName term={topic.term} letter={topic.letter} variant="chip" />
            {attempt && (
              <>
                <span>{t(`mode.${attempt.mode}`)}</span>
                {attempt.status !== "completed" && <span>{t(`review.${attempt.status}`)}</span>}
                <span>{format.dateTime(attempt.startedAt, "date")}</span>
              </>
            )}
          </div>
        }
      />
      {loading ? (
        <p role="status" aria-live="polite">
          {t("review.loading")}
        </p>
      ) : (
        <>
          {!attempt && <InfoNote>{t("review.gone")}</InfoNote>}
          {attempt && (
            <div className="grid items-start gap-4 lg:grid-cols-2">
              <div className="grid gap-3">
                {showKeep ? (
                  <section className={cn(mockCard, "grid gap-2")} aria-label={t("review.keep")}>
                    {attempt.kept ? (
                      <>
                        <p role="status" aria-live="polite" className="font-semibold">
                          {t("review.kept")}
                        </p>
                        <Button
                          variant="destructive-tertiary"
                          className="justify-self-start"
                          icon="trash-2"
                          loading={busy}
                          onClick={() => {
                            void remove();
                          }}
                        >
                          {t("review.delete")}
                        </Button>
                      </>
                    ) : (
                      <>
                        <p>{t("review.keepNote")}</p>
                        <Switch
                          checked={false}
                          disabled={busy}
                          disabledReason={result.available ? undefined : t("review.keepUnavailable")}
                          label={t("review.keep")}
                          onCheckedChange={() => {
                            void keep();
                          }}
                        />
                        <p className="text-caption text-text-muted">{t("review.replace")}</p>
                      </>
                    )}
                  </section>
                ) : (
                  !fromHere && <InfoNote variant="compact">{t("review.notKept")}</InfoNote>
                )}
                <div role="status" aria-live="polite" className="empty:hidden">
                  {notice && <InfoNote>{t(`review.${notice}`)}</InfoNote>}
                </div>
                {fromHere && (
                  <InfoNote variant="compact">
                    {t(takes.length > 0 ? "review.listenNote" : "review.noTakeNote")}
                  </InfoNote>
                )}
              </div>
              <ReviewFacts attempt={attempt} />
            </div>
          )}
          {(saveFailed || (attempt && !result.available)) && <InfoNote>{t("review.storage")}</InfoNote>}
          <ReviewMaterial
            topic={topic}
            lines={lines}
            attempt={attempt ?? undefined}
            recordings={takes}
            check={attempt ? { ticks, update } : undefined}
          />
          {attempt && attempt.askedItemIds.length > 0 && (
            <div className={mockCard}>
              <label className="grid gap-2">
                <span className="text-h3">{t("review.focus")}</span>
                <select
                  className="rounded-control border border-border-strong bg-surface-raised p-2 min-block-touch"
                  value={focus ?? ""}
                  onChange={(event) => {
                    const checked = FocusItemSchema.safeParse(event.currentTarget.value);
                    const next = checked.data ?? null;
                    setFocus(next);
                    if (result.available) write(() => store.setFocusNextTime(attempt.attemptId, next));
                  }}
                >
                  <option value="">{t("review.focusNone")}</option>
                  {FocusItemSchema.options.map((item) => (
                    <option key={item} value={item}>
                      {t(`review.check.${item}.label`)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}
        </>
      )}
      <div className="flex flex-wrap gap-3">
        <Link href={`/topics/${topic.id}`} className={cn(mockLink, mockSecondaryLink)}>
          {t("review.study")}
        </Link>
        <Link href="/mock" className={cn(mockLink, mockSecondaryLink)}>
          {t("review.new")}
        </Link>
        <Link href={attempt ? "/" : "/progress"} className={mockTextLink}>
          {nav(attempt ? "home" : "progress")}
        </Link>
      </div>
      {navigation.next && (
        <Dialog
          open
          title={t("review.discardTitle")}
          description={t("review.discardBody")}
          closeLabel={t("close")}
          initialFocus={stay}
          onOpenChange={(open) => {
            if (!open) navigation.clear();
          }}
        >
          <div className="grid gap-2">
            <Button ref={stay} onClick={navigation.clear}>
              {t("review.stay")}
            </Button>
            <Button
              variant="secondary"
              loading={busy}
              disabledReason={result?.available ? undefined : t("review.keepUnavailable")}
              onClick={() => {
                if (navigation.next) void keep(navigation.next);
              }}
            >
              {t("review.keepLeave")}
            </Button>
            <Button
              variant="destructive-tertiary"
              disabled={busy}
              onClick={() => {
                if (navigation.next) router.push(navigation.next);
              }}
            >
              {t("review.discard")}
            </Button>
            {notice === "keepFailed" && (
              <p role="status" aria-live="polite">
                {t("review.keepFailed")}
              </p>
            )}
          </div>
        </Dialog>
      )}
    </div>
  );
}
