import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { createTranslator, NextIntlClientProvider } from "next-intl";
import { useEffect, useState, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../../messages/fa.json";
import { buildFormats } from "@/i18n/formats";
import { Link } from "@/i18n/navigation";
import { AudioPlayerProvider } from "@/lib/audio/player";
import { examConfig } from "@/lib/exam/config";
import { createProgressStore } from "@/lib/progress/create-progress-store";
import { IndexedDbProgressStore } from "@/lib/progress/indexeddb-progress-store";
import type { RecordingAnswer } from "@/lib/progress/schema";
import { ClearMockReloadMarker, MockSessionProvider, useMockSession } from "../index";
import { MockAnnouncements } from "./mock-announcements";
import { MockHandoff, useMockHandoff } from "./mock-handoff";
import { MockReview } from "./mock-review";
import { RunnerScreens } from "./mock-runner";
import { examinerLines, examTopics, screenPorts, testDeck } from "./mock-screens.test-data";
import { MockStart } from "./mock-start";
import { ReviewFacts } from "./review-facts";
import { ReviewMaterial } from "./review-material";

const { mock: copy } = messages;
const formats = buildFormats("fa");
const t = createTranslator({ locale: "fa", messages, formats, namespace: "mock" });
const examLimit = {
  minutes: Math.floor(examConfig.examLimitSeconds / 60),
  seconds: examConfig.examLimitSeconds % 60,
};
const cardNames = [1, 2, 3].map((number) => t("draw.card", { number, total: 3 }));
const attemptId = "screen-test-attempt";
const navigation = vi.hoisted(() => ({ push: vi.fn(), attempt: "", pathname: "/mock/practice" }));
const [reviewTopic] = examTopics;
const reviewAttempt = {
  attemptId,
  topicId: reviewTopic.id,
  mode: "practice",
  part: 2,
  startedAt: 1_700_000_000_000,
  situationKey: "A",
  totalMs: 32_000,
  status: "endedEarly",
  askedItemIds: [reviewTopic.situations[0].question.id],
  skippedFollowups: [],
  answers: [],
} as const;

vi.mock("next/navigation", () => ({
  usePathname: () => "/fa/mock/practice",
  useSearchParams: () => new URLSearchParams({ attempt: navigation.attempt }),
}));
vi.mock("@/i18n/navigation", () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => ({ push: navigation.push }),
  Link: ({ href, children, className }: { href: string; children: ReactNode; className?: string }) => (
    <a href={`/fa${href}`} className={className}>
      {children}
    </a>
  ),
}));

function renderScreen(children: ReactNode) {
  return render(children, {
    wrapper: ({ children }) => (
      <NextIntlClientProvider locale="fa" messages={messages} formats={formats} timeZone="Europe/Copenhagen">
        <MockSessionProvider>
          <MockHandoff>
            <AudioPlayerProvider>{children}</AudioPlayerProvider>
          </MockHandoff>
        </MockSessionProvider>
      </NextIntlClientProvider>
    ),
  });
}

function click(name: string | RegExp) {
  fireEvent.click(screen.getByRole("button", { name }));
}

async function runner(mode: "practice" | "exam" = "practice", fakes = screenPorts()) {
  renderScreen(
    <RunnerScreens
      deck={testDeck}
      setup={{ mode, topics: testDeck.topics, attemptId, seed: 1 }}
      themes={[{ id: "test", title: "یک دسته" }]}
      ports={fakes.ports}
    />,
  );
  await screen.findByRole("button", { name: copy.ready.micAllow });
  return fakes;
}

async function draw(record = false) {
  if (record) {
    click(copy.ready.micAllow);
    await screen.findByText(copy.ready.micGranted);
  } else {
    click(copy.ready.micSkip);
  }
  click(copy.ready.toDraw);
  click(t("draw.card", { number: 1, total: 3 }));
  const start = await screen.findByRole("button", { name: copy.reveal.start });
  await waitFor(() => {
    expect(start).not.toHaveAttribute("aria-disabled", "true");
  });
}

function firstAnswer(fakes: ReturnType<typeof screenPorts>) {
  click(copy.reveal.start);
  act(() => {
    fakes.signal("ended");
  });
  act(() => {
    fakes.advance(examConfig.lookSeconds * 1000);
  });
  act(() => {
    fakes.signal("ended");
  });
  act(() => {
    fakes.advance(examConfig.examinerGapMs);
  });
  act(() => {
    fakes.signal("ended");
  });
}

function finishPractice(fakes: ReturnType<typeof screenPorts>) {
  firstAnswer(fakes);
  click(copy.interview.done);
  act(() => {
    fakes.signal("ended");
  });
  act(() => {
    fakes.advance(examConfig.examinerGapMs);
  });
  act(() => {
    fakes.signal("ended");
  });
  act(() => {
    fakes.advance(examConfig.examinerGapMs);
  });
  act(() => {
    fakes.signal("ended");
  });
  click(copy.interview.done);
  act(() => {
    fakes.signal("ended");
  });
}

describe("mock screens", () => {
  beforeEach(() => {
    vi.stubGlobal("matchMedia", () => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    navigation.attempt = "";
    navigation.pathname = "/mock/practice";
    navigation.push.mockClear();
  });

  it("offers practice before exam conditions and explains the time limit up front", () => {
    renderScreen(<MockStart topicCount={3} />);
    const practice = screen.getByRole("link", { name: copy.start.practice });
    const exam = screen.getByRole("link", { name: copy.start.exam });
    expect(practice.compareDocumentPosition(exam)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(screen.getByText(copy.start.notices)).toBeVisible();
    expect(screen.getByText(copy.start.continuous)).toBeVisible();
    expect(screen.getByText(copy.start.interruptions)).toBeVisible();
    expect(screen.getByText(copy.start.noGrade)).toBeVisible();
    expect(screen.getByText(t("start.limit", examLimit))).toBeVisible();
    const title = screen.getByRole("heading", { level: 1 });
    expect(title).toHaveTextContent(t.markup("title", { part: "other", da: (text) => text }));
    expect(within(title).getByText("delprøve 2")).toHaveAttribute("lang", "da");
    expect(within(title).getByText("delprøve 2")).toHaveAttribute("dir", "ltr");
  });

  it("keeps mock copy free of failure labels and ambiguous numeric separators", () => {
    expect(JSON.stringify(copy)).not.toMatch(/مردود|رد شدن|ناموفق|قبول‌نشده|·/);
  });

  it("keeps history hidden and skips the history lookup even with a saved attempt", async () => {
    const store = createProgressStore();
    const saved = { ...reviewAttempt, attemptId: "mock-history-link-test" };
    expect(await store.saveAttempt(saved)).toEqual({ ok: true });
    const attempts = vi.spyOn(IndexedDbProgressStore.prototype, "listAttempts");

    await act(async () => {
      renderScreen(<MockStart topicCount={3} />);
      expect(await store.getAttempt(saved.attemptId)).toMatchObject({ ok: true, value: saved });
    });

    expect(attempts).not.toHaveBeenCalled();
    expect(screen.queryByRole("link", { name: copy.start.history })).not.toBeInTheDocument();
  });

  it.each(["/mock/practice", "/mock/exam"])("preserves a reload marker on %s", async (pathname) => {
    const store = createProgressStore();
    const { attemptId, topicId, mode, startedAt } = reviewAttempt;
    const marker = { attemptId, topicId, mode, startedAt };
    await store.setInProgressMarker(marker);
    navigation.pathname = pathname;
    renderScreen(<ClearMockReloadMarker />);
    expect(await store.getInProgressMarker()).toEqual({ ok: true, value: marker });
  });

  it.each(["/mock", "/mock/review/2024-maj-a", "/topics"])(
    "clears a leftover marker on %s",
    async (pathname) => {
      const store = createProgressStore();
      const { attemptId, topicId, mode, startedAt } = reviewAttempt;
      const marker = { attemptId, topicId, mode, startedAt };
      await store.setInProgressMarker(marker);
      const { rerender } = renderScreen(<ClearMockReloadMarker />);

      navigation.pathname = pathname;
      rerender(<ClearMockReloadMarker />);
      expect(await store.getInProgressMarker()).toEqual({ ok: true, value: null });
    },
  );

  it("checks sound and explains recording before requesting microphone access", async () => {
    const fakes = screenPorts();
    fakes.ports.recorder.requestMic.mockResolvedValue({ type: "denied", reason: "other" });
    await runner("practice", fakes);
    expect(screen.getByText(copy.ready.micExplanation)).toBeVisible();
    expect(fakes.ports.recorder.requestMic).not.toHaveBeenCalled();
    expect(screen.getByText(copy.ready.continueBlocked)).toBeVisible();
    click(copy.ready.play);
    expect(fakes.ports.audio.play).toHaveBeenCalledWith(examConfig.soundCheckClipId, 1, expect.any(Function));
    click(copy.ready.heard);
    expect(screen.getByText(copy.ready.soundOk)).toBeVisible();
    click(copy.ready.micAllow);
    expect(await screen.findByText(copy.ready.micDenied)).toBeVisible();
    click(copy.ready.micSkip);
    click(copy.ready.toDraw);
    expect(screen.getByRole("heading", { name: copy.draw.title })).toBeVisible();
  });

  it("draws one face-down card, disables thumbnails and starts the look after the intro", async () => {
    const fakes = await runner();
    await draw();
    for (const name of cardNames) expect(screen.getByRole("button", { name })).toBeDisabled();
    const start = screen.getByRole("button", { name: copy.reveal.start });
    click(copy.reveal.start);
    expect(start).not.toBeInTheDocument();
    expect(screen.queryByText(copy.look.time)).not.toBeInTheDocument();
    act(() => {
      fakes.signal("ended");
    });
    expect(screen.getByText(copy.look.time)).toBeVisible();
    expect(screen.getByText(copy.look.pictures)).toBeVisible();
    click(copy.look.ready);
    expect(screen.queryByText(copy.look.time)).not.toBeInTheDocument();
  });

  it("keeps the same primary control across audio, answers and closing, then hands off to review", async () => {
    const fakes = await runner();
    await draw();
    click(copy.reveal.start);
    const primary = screen.getByRole("button", { name: copy.examiner.listen });
    act(() => {
      fakes.signal("ended");
    });
    act(() => {
      fakes.advance(examConfig.lookSeconds * 1000);
    });
    act(() => {
      fakes.signal("ended");
    });
    act(() => {
      fakes.advance(examConfig.examinerGapMs);
    });
    act(() => {
      fakes.signal("ended");
    });
    expect(screen.getByRole("button", { name: copy.interview.done })).toBe(primary);
    const repeat = screen.getByRole("button", { name: copy.interview.repeat });
    expect(repeat).toHaveAccessibleDescription(
      `${examConfig.repeatRequestText} ${copy.interview.repeatMeaning}`,
    );
    click(copy.interview.done);
    act(() => {
      fakes.signal("ended");
    });
    act(() => {
      fakes.advance(examConfig.examinerGapMs);
    });
    act(() => {
      fakes.signal("ended");
    });
    act(() => {
      fakes.advance(examConfig.examinerGapMs);
    });
    act(() => {
      fakes.signal("ended");
    });
    click(copy.interview.done);
    act(() => {
      fakes.signal("ended");
    });
    expect(screen.getByRole("heading", { name: copy.end.title })).toBeVisible();
    expect(screen.getByRole("button", { name: copy.end.review })).toBe(primary);
    click(copy.end.review);
    const [destination] = fakes.ports.navigate.mock.lastCall ?? [];
    expect(destination).toMatchObject({ to: "review", attempt: { status: "completed" } });
    expect(destination?.attempt?.answers.length).toBeGreaterThan(0);
  });

  it("keeps focus in the primary slot when Start hands over to the examiner", async () => {
    await runner();
    await draw();
    const start = screen.getByRole("button", { name: copy.reveal.start });
    start.focus();
    click(copy.reveal.start);
    await waitFor(() => {
      expect(document.activeElement).toBe(screen.getByRole("button", { name: copy.examiner.listen }));
    });
  });

  it("warns before Close discards recordings on the end view", async () => {
    const fakes = await runner();
    click(copy.ready.micAllow);
    await screen.findByText(copy.ready.micGranted);
    click(copy.ready.toDraw);
    click(t("draw.card", { number: 1, total: 3 }));
    const start = await screen.findByRole("button", { name: copy.reveal.start });
    await waitFor(() => {
      expect(start).not.toHaveAttribute("aria-disabled", "true");
    });
    finishPractice(fakes);
    await screen.findByRole("heading", { name: copy.end.title });
    click(copy.close);
    const dialog = screen.getByRole("dialog", { name: copy.end.discardTitle });
    expect(dialog).toHaveAccessibleDescription(copy.end.discardBody);
    await waitFor(() => {
      expect(within(dialog).getByRole("button", { name: copy.review.stay })).toHaveFocus();
    });
    fireEvent.click(within(dialog).getByRole("button", { name: copy.review.discard }));
    expect(navigation.push).toHaveBeenCalledWith("/mock");
  });

  it("offers to review sample answers when closing an attempt without recordings", async () => {
    const fakes = await runner();
    await draw();
    finishPractice(fakes);
    await screen.findByRole("heading", { name: copy.end.title });
    click(copy.close);
    const dialog = screen.getByRole("dialog", { name: copy.end.discardTitle });
    expect(dialog).toHaveAccessibleDescription(copy.end.discardBodyNoRecording);
    fireEvent.click(within(dialog).getByRole("button", { name: copy.leave }));
    expect(navigation.push).toHaveBeenCalledWith("/mock");
  });

  it("explains a first-answer recorder failure immediately and waits to announce it", async () => {
    const fakes = screenPorts();
    fakes.ports.recorder.start.mockImplementation(() => {
      throw new DOMException("Recorder failed", "NotSupportedError");
    });
    await runner("practice", fakes);
    await draw(true);
    firstAnswer(fakes);
    expect(screen.getByText(t("interview.firstStep", { current: 1, total: 2 }))).toBeVisible();
    expect(screen.getByText(copy.live.notRecording)).toBeVisible();
    const announcements = () => fakes.ports.announce.emit.mock.calls.map(([message]) => message.key);
    expect(announcements()).not.toContain("mock.live.notRecording");
    click(copy.interview.done);
    act(() => {
      fakes.signal("ended");
    });
    expect(announcements()).toContain("mock.live.notRecording");
  });

  it("labels a SIRI situation intro as SIRI when its text is shown", async () => {
    const fakes = await runner();
    await draw();
    click(copy.reveal.start);
    act(() => {
      fakes.signal("ended");
      fakes.advance(examConfig.lookSeconds * 1000);
    });
    click(copy.examiner.showText);
    expect(screen.getByText("SIRI").parentElement).toHaveTextContent("متن SIRI");
  });

  it("offers review from the leave dialog and hides no exam notices when timers are off", async () => {
    const fakes = await runner("exam");
    await draw();
    click(copy.reveal.start);
    act(() => {
      fakes.signal("ended");
    });
    act(() => {
      fakes.advance(examConfig.lookSeconds * 1000);
    });
    act(() => {
      fakes.signal("ended");
    });
    act(() => {
      fakes.advance(examConfig.examinerGapMs);
    });
    act(() => {
      fakes.signal("ended");
    });
    expect(screen.queryByRole("button", { name: copy.interview.hints })).not.toBeInTheDocument();
    click(copy.interview.timers);
    expect(screen.getByRole("button", { name: copy.interview.timers })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    act(() => {
      fakes.advance(examConfig.part1HandoverSeconds * 1000);
    });
    expect(screen.getByText(copy.live.handover)).toBeVisible();
    click(copy.leave);
    const dialog = screen.getByRole("dialog", { name: copy.dialog.leaveTitle });
    fireEvent.click(within(dialog).getByRole("button", { name: copy.dialog.endReview }));
    expect(fakes.ports.navigate.mock.lastCall?.[0]).toMatchObject({
      to: "review",
      attempt: { status: "endedEarly" },
    });
  });

  it("explains the interruption label in the exam dialog", async () => {
    const fakes = await runner("exam");
    await draw();
    firstAnswer(fakes);
    act(() => {
      fakes.page("hidden");
      fakes.page("visible");
    });
    const dialog = screen.getByRole("dialog", { name: "آزمون موقتاً قطع شد" });
    expect(
      within(dialog).getByText(
        "این نوبت با برچسب «قطع‌شده» ثبت می‌شود. این برچسب دربارهٔ پاسخ‌های شما چیزی نمی‌گوید.",
      ),
    ).toBeVisible();
  });

  it("renders Danish in a live announcement with its language, using the topic reference", () => {
    const first = testDeck.topics[0];
    if (!first) throw new Error("Test deck is empty");
    renderScreen(
      <MockAnnouncements
        deck={testDeck}
        revision={1}
        messages={[
          {
            key: "mock.live.revealed",
            params: { letter: first.letter, topicName: { topicId: first.id, field: "title" } },
          },
        ]}
      />,
    );
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
    expect(within(screen.getByRole("status")).getByText(first.title.da)).toHaveAttribute("lang", "da");
  });

  it("loads a local attempt, shows the sample and saves the user's self-check and focus", async () => {
    navigation.attempt = attemptId;
    const store = createProgressStore();
    await store.saveAttempt({ ...reviewAttempt });
    renderScreen(<MockReview topic={reviewTopic} lines={examinerLines} />);
    expect(await screen.findByRole("button", { name: copy.review.sample })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    const intro = screen.getByRole("heading", { name: copy.review.intro }).parentElement;
    expect(intro).toHaveTextContent("متن SIRI");
    expect(intro).not.toHaveTextContent("متن پیشنهادی");
    expect(screen.getByText(copy.review.notRecorded)).toBeVisible();
    expect(screen.queryByRole("heading", { name: copy.review.partSecond })).not.toBeInTheDocument();
    const check = screen.getByRole("checkbox", { name: copy.review.check.gaveReason.label });
    fireEvent.click(check);
    expect(check).toBeChecked();
    fireEvent.change(screen.getByRole("combobox", { name: copy.review.focus }), {
      target: { value: "gaveReason" },
    });
    await waitFor(async () => {
      expect(await store.getAttempt(attemptId)).toMatchObject({
        ok: true,
        value: { selfCheck: { first: { gaveReason: true } }, focusNextTime: "gaveReason", kept: false },
      });
    });
  });

  it("reveals the app's answer translations only for samples that have one", () => {
    const [first, second] = reviewTopic.situations;
    const modelAnswer = {
      ...first.question.modelAnswer,
      text: { da: "Det er en god grund." },
      translation: { fa: "این دلیل خوبی است.", origin: "app" },
    } satisfies typeof first.question.modelAnswer;
    const shortAnswer = {
      ...modelAnswer,
      id: `${first.id}.followup1.answer`,
      text: { da: "Det er rigtigt." },
      translation: { fa: "درست است.", origin: "app" },
    } satisfies typeof modelAnswer;
    renderScreen(
      <ReviewMaterial
        topic={{
          ...reviewTopic,
          situations: [
            {
              ...first,
              question: { ...first.question, modelAnswer },
              followups: [
                {
                  id: `${first.id}.followup1`,
                  text: { da: "Hvad mener du?", fa: "نظر شما چیست؟" },
                  verification: { status: "unchecked" },
                  answer: shortAnswer,
                },
              ],
            },
            second,
          ],
        }}
        lines={examinerLines}
      />,
    );

    const sources = screen.getAllByText(messages.study.answerTranslationSource);
    expect(sources).toHaveLength(2);
    for (const [index, { role, answer }] of [
      { role: copy.examiner.first, answer: modelAnswer },
      { role: copy.examiner.followup, answer: shortAnswer },
    ].entries()) {
      const toggle = screen.getByRole("button", {
        name: t("review.answerTranslation", { question: role }),
      });
      const translation = screen.getByText(answer.translation.fa);
      const danish = screen.getByText(answer.text.da);
      const source = sources[index];
      expect(toggle).toHaveAttribute("aria-expanded", "false");
      expect(translation).not.toBeVisible();
      expect(source).not.toBeVisible();

      fireEvent.click(toggle);
      expect(toggle).toHaveAttribute("aria-expanded", "true");
      expect(translation).toBeVisible();
      expect(translation).toHaveAttribute("lang", "fa");
      expect(translation).toHaveAttribute("dir", "rtl");
      expect(source).toBeVisible();
      expect(danish).toBeVisible();
      expect(danish).toHaveAttribute("lang", "da");
      expect(danish).toHaveAttribute("dir", "ltr");

      fireEvent.click(toggle);
      expect(toggle).toHaveAttribute("aria-expanded", "false");
      expect(translation).not.toBeVisible();
    }

    expect(
      screen.queryByRole("button", {
        name: t("review.answerTranslation", { question: copy.examiner.second }),
      }),
    ).not.toBeInTheDocument();
  });

  it.each([
    { outcome: "leaves directly when there is no take", unkept: false },
    { outcome: "opens the keep dialog when there is an unkept take", unkept: true },
  ])("queues a link during review loading and $outcome", async ({ unkept }) => {
    const saved = Promise.withResolvers<{ ok: true }>();
    const take = Promise.withResolvers<RecordingAnswer | null>();
    const question = reviewTopic.situations[0].question;
    const target = "/topics?sort=recent#terms";
    navigation.attempt = reviewAttempt.attemptId;

    function PendingReview() {
      const { setDestination } = useMockHandoff();
      const { recordings } = useMockSession();
      const [ready, setReady] = useState(false);
      useEffect(() => {
        recordings.collect(reviewAttempt.attemptId, question.id, take.promise);
        setDestination({
          type: "navigate",
          to: "review",
          attempt: { ...reviewAttempt },
          saveResult: saved.promise,
        });
        setReady(true);
      }, [recordings, setDestination]);
      return ready ? <MockReview topic={reviewTopic} lines={examinerLines} /> : null;
    }
    renderScreen(
      <>
        <Link href={target}>{messages.nav.topics}</Link>
        <PendingReview />
      </>,
    );

    const nav = screen.getByRole("link", { name: messages.nav.topics });
    expect(screen.getByText(copy.review.loading)).toBeVisible();
    expect(screen.queryByRole("link", { name: copy.review.study })).not.toBeInTheDocument();
    expect(fireEvent.click(nav)).toBe(false);
    expect(navigation.push).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await act(async () => {
      saved.resolve({ ok: true });
      await saved.promise;
    });
    expect(screen.getByText(copy.review.loading)).toBeVisible();

    await act(async () => {
      take.resolve(
        unkept
          ? {
              itemId: question.id,
              blob: new Blob(["take"], { type: "audio/webm" }),
              mimeType: "audio/webm",
              durationMs: 1000,
            }
          : null,
      );
      await take.promise;
    });
    if (unkept) {
      const dialog = await screen.findByRole("dialog", { name: copy.review.discardTitle });
      expect(navigation.push).not.toHaveBeenCalled();
      fireEvent.click(within(dialog).getByRole("button", { name: copy.review.discard }));
    } else {
      await screen.findByRole("link", { name: copy.review.study });
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    }
    expect(navigation.push).toHaveBeenCalledExactlyOnceWith(target);
  });

  it.each([false, true])("sets the sample default once for the initial wide layout (%s)", (wide) => {
    const query = Object.assign(new EventTarget(), { matches: wide });
    vi.stubGlobal("matchMedia", () => query);
    const material = {
      topic: reviewTopic,
      lines: examinerLines,
      attempt: {
        ...reviewAttempt,
        kept: false,
        selfCheck: { first: {}, general: {} },
        focusNextTime: null,
      },
    };
    const { rerender } = renderScreen(
      <ReviewMaterial
        {...material}
        recordings={[
          {
            itemId: reviewTopic.situations[0].question.id,
            durationMs: 1000,
            url: "blob:take",
            blob: new Blob(["take"], { type: "audio/webm" }),
            mimeType: "audio/webm",
          },
        ]}
      />,
    );
    const sample = screen.getByRole("button", { name: copy.review.sample });
    expect(sample).toHaveAttribute("aria-expanded", String(wide));
    act(() => {
      query.matches = !wide;
      query.dispatchEvent(new Event("change"));
    });
    expect(sample).toHaveAttribute("aria-expanded", String(wide));
    rerender(<ReviewMaterial {...material} />);
    expect(sample).toHaveAttribute("aria-expanded", String(wide));
    fireEvent.click(sample);
    expect(sample).toHaveAttribute("aria-expanded", String(!wide));
  });

  it("describes the exam limit in minutes and seconds on short reviews", () => {
    renderScreen(
      <ReviewFacts
        attempt={{
          ...reviewAttempt,
          mode: "exam",
          status: "completed",
          kept: false,
          selfCheck: { first: {}, general: {} },
          focusNextTime: null,
        }}
      />,
    );
    expect(screen.getByText(t("review.short", examLimit))).toBeVisible();
  });
});
