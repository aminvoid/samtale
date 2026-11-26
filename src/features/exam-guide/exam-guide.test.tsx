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
    expect(screen.getByText(/آخرین بررسی/)).toHaveTextContent("۲۲ نوامبر ۲۰۲۶");
    expect(screen.getByRole("heading", { name: /بخش اول/ })).toBeVisible();
    expect(screen.getByText("censor")).toHaveAttribute("lang", "da");
    expect(screen.getByText("eksaminator")).toHaveAttribute("dir", "ltr");
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
    expect(
      within(steps).getByRole("button", { name: /پخش صدای ممتحن به دانمارکی/, description: intro }),
    ).toBeVisible();
    expect(
      within(steps).getByText("Hvilke fordele og ulemper mener du, der kan være ved …?"),
    ).toHaveAttribute("lang", "da");
    expect(within(steps).getAllByText(/عین عبارت/)).toHaveLength(2);
    expect(within(steps).getByText(/جملهٔ ثابتی برای این مرحله تعیین نشده است/)).toBeVisible();
    const translationPrefix = guide.lines.translation.replace("{meaning}", "");
    expect(within(steps).getAllByText((text) => text.startsWith(translationPrefix))).toHaveLength(3);
    expect(within(steps).getByRole("link", { name: /مقررات بخش دوم/ })).toHaveAttribute(
      "href",
      "https://danskogproever.dk/media/yqxa0zdu/vejledning-om-den-praktiske-proeveafholdelse-okt-2026.pdf#page=46",
    );

    const timeline = screen.getByRole("region", { name: guide.section.timeline });
    const segments = within(timeline).getAllByRole("listitem");
    expect(segments).toHaveLength(4);
    expect(segments[1]).toHaveTextContent("حدود ۱۰ ثانیه");
    expect(segments[2]).toHaveTextContent("حدود ۴٫۵ دقیقه");
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

  it("includes all four follow-up types, language quality, and the rules for grades and special arrangements", () => {
    renderWithIntl(<DelproeveTwoGuide lines={prepareExaminerLines(examinerLines, example)} />);
    const followUps = screen.getByRole("region", { name: guide.section.followUps });
    expect(within(followUps).getAllByRole("heading", { level: 3 })).toHaveLength(4);
    expect(within(followUps).getByText("Mener du, at …? Hvorfor?/Hvorfor ikke?")).toHaveAttribute(
      "lang",
      "da",
    );
    expect(screen.getByText(guide.assessment.language)).toBeVisible();
    const assessment = screen.getByRole("region", { name: guide.section.assessment });
    expect(within(assessment).getByRole("link", { name: /معیارهای رسمی ارزیابی/ })).toHaveAttribute(
      "href",
      "https://www.retsinformation.dk/eli/lta/2025/1687/pdf#page=17",
    );
    const examiner = screen.getByRole("region", { name: guide.section.examiner });
    expect(within(examiner).getByRole("link", { name: /راهنمای رسمی رفتار ممتحن/ })).toHaveAttribute(
      "href",
      "https://danskogproever.dk/media/spjba3cd/huskeliste-til-eksaminator-og-censor-ved-den-mundtlige-proeve.pdf",
    );
    expect(screen.getByText(guide.fits.noNotes)).toBeVisible();
    const grade = screen.getByRole("region", { name: guide.section.grade });
    const scale = within(grade).getByRole("list", { name: guide.grade.scaleLabel });
    expect(scale).toHaveAttribute("dir", "ltr");
    expect(
      within(scale)
        .getAllByRole("listitem")
        .map((item) => item.textContent),
    ).toEqual(["۱۲", "۱۰", "۷", "۴", "۰۲", "۰۰", "\u200e−۳"]);
    expect(within(grade).getByText(guide.grade.holistic)).toBeVisible();
    expect(within(grade).getByText("۲٫۰")).toHaveAttribute("dir", "ltr");
    expect(within(grade).getByText("۱٫۹")).toHaveAttribute("dir", "ltr");
    expect(within(grade).getByRole("link", { name: /منبع رسمی مقیاس نمره/ })).toHaveAttribute(
      "href",
      "https://www.retsinformation.dk/eli/lta/2024/1759",
    );
    expect(
      within(grade).getByRole("link", { name: "منبع رسمی شرط قبولی (به سایت دیگری می‌روید)" }),
    ).toHaveAttribute("href", "https://www.retsinformation.dk/eli/lta/2025/1687");
    const fits = screen.getByRole("region", { name: guide.section.fits });
    expect(within(fits).getByText(/دست‌کم ۸ هفته/)).toBeVisible();
    expect(within(fits).getByText("maj–juni")).toHaveAttribute("lang", "da");
    expect(within(fits).getByText(/زمستانی سال ۲۰۲۶ گذشته است/)).toHaveTextContent(/۲۰۲۷/);
    expect(within(fits).getByText(guide.fits.arrangementsGrading)).toBeVisible();
    expect(within(fits).getByRole("link", { name: /مقررات بخش دوم/ })).toHaveAttribute(
      "href",
      "https://danskogproever.dk/media/yqxa0zdu/vejledning-om-den-praktiske-proeveafholdelse-okt-2026.pdf#page=45",
    );
    expect(within(fits).getByRole("link", { name: /شرایط ویژه در راهنمای اجرایی/ })).toHaveAttribute(
      "href",
      "https://danskogproever.dk/media/yqxa0zdu/vejledning-om-den-praktiske-proeveafholdelse-okt-2026.pdf#page=25",
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
