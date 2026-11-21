import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import messages from "../../../../messages/fa.json";
import { buildFormats } from "@/i18n/formats";
import { AudioPlayerProvider } from "@/lib/audio/player";
import { examConfig } from "@/lib/exam/config";
import { createProgressStore } from "@/lib/progress/create-progress-store";
import { MockSessionProvider } from "../index";
import { MockAnnouncements } from "./mock-announcements";
import { MockHandoff } from "./mock-handoff";
import { MockReview } from "./mock-review";
import { RunnerScreens } from "./mock-runner";
import { examinerLines, examTopics, screenPorts, testDeck } from "./mock-screens.test-data";
import { MockStart } from "./mock-start";

const { mock: copy } = messages;
const attemptId = "screen-test-attempt";
const navigation = vi.hoisted(() => ({ push: vi.fn(), attempt: "" }));

vi.mock("next/navigation", () => ({
  usePathname: () => "/fa/mock/practice",
  useSearchParams: () => new URLSearchParams({ attempt: navigation.attempt }),
}));
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push: navigation.push }),
  Link: ({ href, children, className }: { href: string; children: ReactNode; className?: string }) => (
    <a href={`/fa${href}`} className={className}>
      {children}
    </a>
  ),
}));

function renderScreen(children: ReactNode) {
  return render(
    <NextIntlClientProvider
      locale="fa"
      messages={messages}
      formats={buildFormats("fa")}
      timeZone="Europe/Copenhagen"
    >
      <MockSessionProvider>
        <MockHandoff>
          <AudioPlayerProvider>{children}</AudioPlayerProvider>
        </MockHandoff>
      </MockSessionProvider>
    </NextIntlClientProvider>,
  );
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

async function draw() {
  click(copy.ready.micSkip);
  click(copy.ready.toDraw);
  click(/کارت ۱ از ۳/);
  const start = await screen.findByRole("button", { name: copy.reveal.start });
  await waitFor(() => {
    expect(start).not.toHaveAttribute("aria-disabled", "true");
  });
}

function finishPractice(fakes: ReturnType<typeof screenPorts>) {
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
  afterEach(cleanup);

  it("offers practice before exam conditions and explains the time limit up front", () => {
    renderScreen(<MockStart topicCount={3} />);
    const practice = screen.getByRole("link", { name: copy.start.practice });
    const exam = screen.getByRole("link", { name: copy.start.exam });
    expect(practice.compareDocumentPosition(exam)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(screen.getByText(copy.start.notices)).toBeVisible();
    expect(screen.getByText(copy.start.continuous)).toBeVisible();
    expect(screen.getByText(copy.start.interruptions)).toBeVisible();
    expect(screen.getByText(copy.start.noGrade)).toBeVisible();
  });

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
    expect(
      screen.getAllByRole("button", { name: /کارت . از ۳/ }).every((card) => card.hasAttribute("disabled")),
    ).toBe(true);
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
    click(/کارت ۱ از ۳/);
    const start = await screen.findByRole("button", { name: copy.reveal.start });
    await waitFor(() => {
      expect(start).not.toHaveAttribute("aria-disabled", "true");
    });
    finishPractice(fakes);
    await screen.findByRole("heading", { name: copy.end.title });
    click(copy.close);
    const dialog = screen.getByRole("dialog", { name: copy.end.discardTitle });
    await waitFor(() => {
      expect(within(dialog).getByRole("button", { name: copy.review.stay })).toHaveFocus();
    });
    fireEvent.click(within(dialog).getByRole("button", { name: copy.review.discard }));
    expect(navigation.push).toHaveBeenCalledWith("/mock");
  });

  it("closes the end view without a warning when nothing was recorded", async () => {
    const fakes = await runner();
    await draw();
    finishPractice(fakes);
    await screen.findByRole("heading", { name: copy.end.title });
    expect(screen.getByRole("link", { name: copy.close })).toHaveAttribute("href", "/fa/mock");
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
    const topic = examTopics[0];
    if (!topic) throw new Error("Test deck is empty");
    navigation.attempt = attemptId;
    const store = createProgressStore();
    await store.saveAttempt({
      attemptId,
      topicId: topic.id,
      mode: "practice",
      part: 2,
      startedAt: Date.now(),
      situationKey: "A",
      totalMs: 32_000,
      status: "endedEarly",
      askedItemIds: [topic.situations[0].question.id],
      skippedFollowups: [],
      answers: [],
    });
    renderScreen(<MockReview topic={topic} lines={examinerLines} />);
    expect(await screen.findByRole("heading", { name: copy.review.sample })).toBeVisible();
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
});
