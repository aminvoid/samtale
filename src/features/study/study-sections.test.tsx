import { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import messages from "../../../messages/fa.json";
import { AudioPlayerProvider } from "@/lib/audio/player";
import type { TermSummary, Topic } from "@/lib/content/repository";
import { renderWithIntl } from "@/test/render-with-intl";
import { AnswerAloud } from "./answer-aloud";
import { AnswerDisclosure } from "./answer-disclosure";
import { ExaminerIntro } from "./examiner-intro";
import { getStudyProgressStore } from "./study-progress-store";
import { StudyQuestion } from "./study-question";
import { StudyVisit } from "./study-visit";
import { TranslationToggle } from "./translation-toggle";
import { VerificationNote } from "./verification-note";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

const { study } = messages;
const term: TermSummary = {
  id: "2024-maj",
  year: 2024,
  session: "maj",
  formatEraId: "current",
  topicIds: [],
};
const terms = new Map([[term.id, term]]);
const answer: Topic["general"]["question"]["modelAnswer"] = {
  id: "2024-maj-a.sitA.q1.answer",
  text: { da: "For det første er det vigtigt." },
  audio: { url: "/audio/test.mp3", durationMs: 2500, words: [[0, 3, 50, 210]] },
  emphasis: [{ start: 0, end: 14 }],
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("study sections", () => {
  it("reveals and hides the question translation without changing the toggle's name", async () => {
    const user = userEvent.setup();
    renderWithIntl(<TranslationToggle text="به نظرتان چرا؟" question="Hvorfor tror du det?" />);
    const toggle = screen.getByRole("button", { name: study.translation });
    const text = screen.getByText("به نظرتان چرا؟");

    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(text).not.toBeVisible();
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(text).toBeVisible();
    expect(text).toHaveAttribute("lang", "fa");
    expect(text).toHaveAttribute("dir", "rtl");
    expect(screen.queryByText(study.whyHint)).not.toBeInTheDocument();
    await user.click(toggle);
    expect(text).not.toBeVisible();
  });

  it.each([
    ["Hvad mener du? Hvorfor?/Hvorfor ikke?", true],
    ["Hvad mener du? Hvorfor / hvorfor ikke?", true],
    ["Hvorfor?/Hvorfor ikke? Hvad mener du?", false],
    ["Hvad mener du? Hvorfor?", false],
    ["Hvorfor ikke?", false],
  ])("applies the separate display hint according to the Danish ending %#", async (question, shown) => {
    const user = userEvent.setup();
    const translation = "به نظرتان چه می‌شود؟";
    renderWithIntl(<TranslationToggle text={translation} question={question} />);
    await user.click(screen.getByRole("button", { name: study.translation }));
    const original = screen.getByText(translation, { exact: true });
    expect(original).toHaveTextContent(translation);
    const hint = screen.queryByText(study.whyHint);
    if (shown) {
      expect(hint).toBeVisible();
      expect(hint?.previousElementSibling).toBe(original);
    } else {
      expect(hint).not.toBeInTheDocument();
    }
  });

  it("keeps the sample answer collapsed and highlights the current word inside booklet emphasis", async () => {
    const user = userEvent.setup();
    const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
    vi.spyOn(HTMLMediaElement.prototype, "paused", "get").mockReturnValue(false);
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => undefined);
    vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => undefined);

    renderWithIntl(
      <AudioPlayerProvider>
        <AnswerDisclosure kind="model" item={answer} template={1} />
      </AudioPlayerProvider>,
    );
    const heading = screen.getByRole("heading", { level: 3, name: study.sample });
    const toggle = within(heading).getByRole("button", { name: study.sample });
    expect(toggle.parentElement).toBe(heading);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("button", { name: study.playSample })).not.toBeInTheDocument();
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("radiogroup", { name: messages.audio.speed })).toBeVisible();
    expect(screen.queryByRole("button", { name: study.translation })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: study.playSample }));
    const media = play.mock.contexts[0];
    if (!(media instanceof HTMLMediaElement)) throw new Error("The sample answer did not start.");
    media.currentTime = 0.1;
    fireEvent.playing(media);
    const currentWord = screen.getByText("For", { exact: true });
    expect(currentWord).toHaveClass("bg-highlight", "underline");
    expect(currentWord.closest("strong")).toHaveTextContent("For det første");
    expect(currentWord.closest("p")).toHaveTextContent(answer.text.da);
    expect(currentWord.closest("p")).toHaveAttribute("lang", "da");
    expect(currentWord.closest("p")).toHaveAttribute("dir", "ltr");
  });

  it("uses official wording only on matched required questions", async () => {
    const user = userEvent.setup();
    const verification = {
      status: "matches",
      sourceTermId: term.id,
      checkedOn: "2026-11-18",
    } satisfies Topic["general"]["question"]["verification"];
    const view = renderWithIntl(<VerificationNote verification={verification} sourceTerm={term} />);
    expect(screen.getByText(study.sources.official)).toBeVisible();
    await user.click(screen.getByRole("button", { name: /جزئیات تطبیق/ }));
    expect(screen.getByText("Maj–Juni 2024")).toHaveAttribute("lang", "da");
    expect(screen.getByText(/تاریخ بررسی/)).toBeVisible();
    view.unmount();

    renderWithIntl(<VerificationNote verification={verification} sourceTerm={term} followup />);
    expect(screen.getByText(/متن پیشنهادی/)).toBeVisible();
    expect(screen.queryByText(study.sources.official)).not.toBeInTheDocument();
  });

  it("shows unchecked and differing booklet text labels with the available SIRI source", async () => {
    const user = userEvent.setup();
    renderWithIntl(
      <>
        <VerificationNote verification={{ status: "unchecked" }} />
        <VerificationNote
          verification={{ status: "differs", sourceTermId: term.id, checkedOn: "2026-11-18" }}
          sourceTerm={term}
        />
      </>,
    );
    expect(screen.getByText(/متن سؤال از کتابچه، برگرفته/)).toBeVisible();
    expect(screen.getByText(study.sources.booklet)).toBeVisible();
    expect(screen.queryByText(study.sources.official)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /متن SIRI کمی فرق دارد/ }));
    expect(screen.getByText(/منبع تطبیق/)).toBeVisible();
    expect(screen.getByText("Maj–Juni 2024")).toHaveAttribute("dir", "ltr");
    expect(screen.getByText(/برای نمایش در دسترس نیست/)).toBeVisible();
  });

  it("records opening separately from explicit, device-local practice confirmation", async () => {
    const user = userEvent.setup();
    const store = getStudyProgressStore();
    const topicId = "2024-maj-a";
    const itemId = "2024-maj-a.sitA.q1";
    renderWithIntl(
      <>
        <StudyVisit topicId={topicId}>
          <p>{study.layoutBody}</p>
        </StudyVisit>
        <AnswerAloud topicId={topicId} itemId={itemId} primary />
      </>,
    );

    await waitFor(async () => {
      expect(await store.getLastOpened()).toMatchObject({ ok: true, value: { topicId } });
    });
    const entry = screen.getByRole("link", { name: study.answerAloud });
    expect(entry).toHaveAttribute("href", `#answer-${itemId}`);
    expect(await store.listPracticeEvents({ topicId })).toEqual({ ok: true, value: [] });

    const done = screen.getByRole("button", { name: study.answerDone });
    await user.click(done);
    await waitFor(() => {
      expect(done).toHaveAttribute("aria-disabled", "true");
    });
    expect(done).toHaveFocus();
    expect(await store.listPracticeEvents({ topicId })).toMatchObject({
      ok: true,
      value: [{ topicId, itemId, kind: "answer-aloud" }],
    });
    await user.click(done);
    const practiceEvents = await store.listPracticeEvents({ topicId });
    expect(practiceEvents.ok && practiceEvents.value).toHaveLength(1);
  });

  it("keeps Danish question and intro wording out of aria-labels", () => {
    const question = {
      id: "2024-maj-a.sitA.q1",
      text: { da: "Hvorfor tror du det?", fa: "به نظرتان چرا؟" },
      verification: { status: "unchecked" },
      keywords: [],
      modelAnswer: answer,
      audio: answer.audio,
    } satisfies Topic["general"]["question"];
    const intro = {
      id: "2024-maj-a.sitA.intro",
      text: { da: "Situation A viser en arbejdsplads." },
      origin: "siri",
      sourceLabel: { kind: "siri", termId: term.id },
      audio: answer.audio,
    } satisfies NonNullable<Topic["situations"][number]["intro"]>;
    const { container } = renderWithIntl(
      <AudioPlayerProvider>
        <ExaminerIntro intro={intro} terms={terms} />
        <StudyQuestion question={question} kind="first-question" terms={terms} />
      </AudioPlayerProvider>,
    );
    expect(screen.getByRole("button", { name: study.playQuestion })).toBeVisible();
    expect(screen.getByRole("button", { name: study.playIntro })).toBeVisible();
    expect(screen.getByText(/متن پیشنهادی/)).toBeVisible();
    expect(screen.getByText(question.text.da)).toHaveAttribute("lang", "da");
    expect(screen.getByText(intro.text.da)).toHaveAttribute("lang", "da");
    for (const control of container.querySelectorAll("[aria-label]")) {
      expect(control.getAttribute("aria-label")).toMatch(/\p{Script=Arabic}/u);
    }
  });
});
