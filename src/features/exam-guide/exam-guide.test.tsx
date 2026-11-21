import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import messages from "../../../messages/fa.json";
import type { ExaminerLines } from "@/lib/content/repository";
import { renderWithIntl } from "@/test/render-with-intl";
import { DelproeveTwoGuide } from "./delproeve-two-guide";
import { prepareExaminerLines } from "./examiner-lines";
import { GuideOverview } from "./guide-overview";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

const { guide } = messages;
const introTemplate = "Her er der to billeder, som viser nogle situationer, der handler om emnet {topic}.";
const transition = "Nu vil jeg stille dig et spørgsmål af en mere overordnet karakter.";
const closing = "Tak, så er prøven forbi.";
const examinerLines: ExaminerLines = [
  {
    id: "examiner.intro",
    role: "intro",
    text: { da: introTemplate },
    origin: "siri",
    placeholders: ["topic"],
  },
  {
    id: "examiner.transition",
    role: "transition",
    text: { da: transition },
    origin: "app",
    placeholders: [],
    audio: { url: "/audio/transition.mp3", durationMs: 2400 },
  },
  {
    id: "examiner.closing",
    role: "closing",
    text: { da: closing },
    origin: "siri",
    placeholders: [],
    audio: { url: "/audio/closing.mp3", durationMs: 2200 },
  },
];
const example = {
  title: { da: "Mangel på arbejdskraft", fa: "کمبود نیروی کار" },
  examinerAudio: [{ lineId: "examiner.intro", audio: { url: "/audio/intro.mp3", durationMs: 11000 } }],
};

afterEach(cleanup);

describe("exam guide", () => {
  it("introduces both parts and links to the part-two guide", () => {
    renderWithIntl(<GuideOverview />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(guide.overview.title);
    expect(screen.getByRole("heading", { name: /بخش اول/ })).toBeVisible();
    expect(screen.getByText(guide.overview.partOneLater)).toBeVisible();
    expect(screen.getByRole("link", { name: guide.overview.partTwoLink })).toHaveAttribute(
      "href",
      "/guide/delproeve-2",
    );
  });

  it("shows seven steps, one total conversation duration, and sourced examiner lines", async () => {
    const user = userEvent.setup();
    renderWithIntl(<DelproeveTwoGuide lines={prepareExaminerLines(examinerLines, example)} />);
    const steps = screen.getByRole("region", { name: guide.section.steps });
    expect(within(steps).getAllByRole("listitem")).toHaveLength(7);
    expect(within(steps).getAllByRole("button")).toHaveLength(3);
    const intro = introTemplate.replace("{topic}", example.title.da);
    expect(within(steps).getByText(intro)).toHaveAttribute("lang", "da");
    expect(within(steps).getByText(intro)).toHaveAttribute("dir", "ltr");
    expect(within(steps).getByRole("button", { description: intro })).toBeVisible();
    expect(within(steps).getAllByText(/عین عبارت/)).toHaveLength(2);
    expect(within(steps).getByText(/جملهٔ ثابتی برای این مرحله تعیین نشده است/)).toBeVisible();
    expect(within(steps).getAllByText(/ترجمهٔ برنامه/)).toHaveLength(3);

    const timeline = screen.getByRole("region", { name: guide.section.timeline });
    const segments = within(timeline).getAllByRole("listitem");
    expect(segments).toHaveLength(4);
    expect(segments[1]).toHaveTextContent("حدود ۱۰ ثانیه");
    expect(segments[2]).toHaveTextContent("حدود ۴ دقیقه و نیم");
    expect(segments[2]).toHaveTextContent(guide.timeline.questions);

    const disclosure = screen.getByRole("button", { name: guide.onThisPage });
    await user.click(disclosure);
    const panelId = disclosure.getAttribute("aria-controls");
    const panel = panelId === null ? null : document.getElementById(panelId);
    if (panel === null) throw new Error("Expected the contents disclosure panel.");
    const navigation = within(panel).getByRole("navigation", { name: guide.onThisPage });
    expect(within(navigation).getByRole("link", { name: guide.section.timeline })).toHaveAttribute(
      "href",
      "#timeline",
    );
  });

  it("includes all four follow-up types, language quality, and citations for the grade facts", () => {
    renderWithIntl(<DelproeveTwoGuide lines={prepareExaminerLines(examinerLines, example)} />);
    const followUps = screen.getByRole("region", { name: guide.section.followUps });
    expect(within(followUps).getAllByRole("heading", { level: 3 })).toHaveLength(4);
    expect(within(followUps).getByText("Mener du, at …? Hvorfor?/Hvorfor ikke?")).toHaveAttribute(
      "lang",
      "da",
    );
    expect(screen.getByText(guide.assessment.language)).toBeVisible();
    expect(screen.getByText(guide.fits.noNotes)).toBeVisible();
    const grade = screen.getByRole("region", { name: guide.section.grade });
    expect(within(grade).getByText("۰۲")).toBeVisible();
    expect(within(grade).getByText("۰۰")).toBeVisible();
    expect(within(grade).getByText("۲٫۰")).toHaveAttribute("dir", "ltr");
    expect(within(grade).getByRole("link", { name: /منبع رسمی مقیاس نمره/ })).toHaveAttribute(
      "href",
      "https://www.retsinformation.dk/eli/lta/2024/1759",
    );
    expect(within(grade).getByRole("link", { name: /منبع رسمی شرط قبولی/ })).toHaveAttribute(
      "href",
      "https://www.retsinformation.dk/eli/lta/2025/1687",
    );
    expect(screen.getByRole("link", { name: guide.next.topics })).toHaveAttribute("href", "/topics");
    expect(screen.getByRole("link", { name: guide.next.mock })).toHaveAttribute("href", "/mock");
  });

  it("keeps the cited intro transcript when an example clip is unavailable", () => {
    renderWithIntl(<DelproeveTwoGuide lines={prepareExaminerLines(examinerLines, null)} />);
    const steps = screen.getByRole("region", { name: guide.section.steps });
    expect(within(steps).getByText(introTemplate.replace("{topic}", "[emne]"))).toBeVisible();
    expect(within(steps).getByText(guide.lines.missing)).toBeVisible();
    expect(within(steps).getAllByRole("button")).toHaveLength(2);
  });
});
