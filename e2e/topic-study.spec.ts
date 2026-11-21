import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import messages from "../messages/fa.json" with { type: "json" };
import { AXE_TAGS, expect, test } from "./fixtures";

const topicUrl = "/fa/topics/2024-maj-b";
const { study } = messages;

async function stubPlayback(page: Page) {
  await page.addInitScript(() => {
    const sources = new WeakMap<HTMLMediaElement, string>();
    const times = new WeakMap<HTMLMediaElement, number>();
    const playing = new WeakSet<HTMLMediaElement>();

    Object.defineProperties(HTMLMediaElement.prototype, {
      src: {
        get(this: HTMLMediaElement) {
          return sources.get(this) ?? "";
        },
        set(this: HTMLMediaElement, source: string) {
          sources.set(this, source);
        },
      },
      currentTime: {
        get(this: HTMLMediaElement) {
          return times.get(this) ?? 0;
        },
        set(this: HTMLMediaElement, time: number) {
          times.set(this, time);
        },
      },
      duration: { get: () => 31 },
      paused: {
        get(this: HTMLMediaElement) {
          return !playing.has(this);
        },
      },
      play: {
        value(this: HTMLMediaElement) {
          playing.add(this);
          this.currentTime = 0.1;
          this.dispatchEvent(new Event("playing"));
          return Promise.resolve();
        },
      },
      pause: {
        value(this: HTMLMediaElement) {
          playing.delete(this);
        },
      },
      load: {
        value() {
          /* Media is driven by the stub. */
        },
      },
    });
  });
}

test("opens a topic from the library, plays clips, and reveals the translation and sample answer", async ({
  page,
}) => {
  await stubPlayback(page);
  await page.goto("/fa/topics/themes/arbejde");
  const topic = page.getByRole("main").locator(`a[href="${topicUrl}"]`);
  const title = await topic.locator('[lang="da"]').first().innerText();
  await topic.click();
  await expect(page).toHaveURL(topicUrl);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);

  const a = page.locator('section[data-study-section="sitA"]:visible');
  const question = a.getByRole("button", { name: study.playQuestion, exact: true });
  await question.click();
  await expect(question).toHaveAttribute("aria-pressed", "true");

  const translation = a.getByRole("button", { name: study.translation, exact: true }).nth(1);
  await expect(translation).toHaveAttribute("aria-expanded", "false");
  await translation.click();
  await expect(translation).toHaveAttribute("aria-expanded", "true");
  await expect(a.getByText(/در بخش سلامت کمبود نیروی کار/).first()).toBeVisible();

  const sample = a.getByRole("heading", { level: 3, name: study.sample }).getByRole("button");
  await expect(sample).toHaveAttribute("aria-expanded", "false");
  await sample.click();
  await a.getByRole("button", { name: study.playSample, exact: true }).click();
  await expect(a.locator('p[lang="da"][dir="ltr"] .bg-highlight')).toBeVisible();
  await expect(question).toHaveAttribute("aria-pressed", "false");
  await expect(a.getByRole("radiogroup", { name: messages.audio.speed })).toBeVisible();

  const aloud = a.getByRole("link", { name: study.answerAloud }).first();
  await aloud.click();
  await expect(a.getByText(study.answerComingSoon).first()).toBeVisible();
  await a.getByRole("button", { name: study.answerDone }).click();
  await expect(a.getByText(study.practiceSaved, { exact: true }).first()).toBeVisible();
  await page.reload();
  await expect(page.getByText(/بار تمرین کرده‌اید/)).toBeVisible();
});

test("lays out RTL study and focuses section headings at 375 and 1280 px", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(topicUrl);
  const nav = () => page.getByRole("navigation", { name: study.sectionNav });
  const general = page.getByRole("heading", { level: 2, name: study.generalHeading });
  const html = page.locator("html");
  await expect(html).toHaveAttribute("lang", "fa");
  await expect(html).toHaveAttribute("dir", "rtl");
  await expect(nav()).toHaveCSS("position", "sticky");
  await expect(nav().getByRole("link")).toHaveCount(3);
  await nav().getByRole("link", { name: study.general }).click();
  await expect(page).toHaveURL(`${topicUrl}#general`);
  await expect(general).toBeFocused();
  await expect(nav().getByRole("link", { name: study.general })).toHaveAttribute("aria-current", "true");
  await expect.poll(async () => (await nav().boundingBox())?.y).toBe(0);
  const mobileNavBox = await nav().boundingBox();
  const mobileHeading = await general.boundingBox();
  if (mobileNavBox === null || mobileHeading === null)
    throw new Error("Expected the mobile navigation and heading.");
  expect(mobileHeading.y).toBeGreaterThanOrEqual(mobileNavBox.y + mobileNavBox.height);
  await page.reload();
  await expect(general).toBeFocused();

  for (const width of [375, 1280]) {
    await page.setViewportSize({ width, height: 812 });
    expect(await html.evaluate((element) => element.scrollWidth)).toBeLessThanOrEqual(width);
    const danish = page.getByRole("main").locator('[lang="da"]');
    expect(await danish.count()).toBeGreaterThan(10);
    await expect(danish.filter({ hasNot: page.locator('[dir="ltr"]') }).first()).toHaveAttribute(
      "dir",
      "ltr",
    );
    await expect(page.getByRole("main").locator('[lang="da"]:not([dir="ltr"])')).toHaveCount(0);
  }

  const navBox = await nav().boundingBox();
  const contentBox = await general.boundingBox();
  if (navBox === null || contentBox === null) throw new Error("Expected the desktop navigation and heading.");
  expect(navBox.x).toBeGreaterThanOrEqual(contentBox.x + contentBox.width);
});

test("opens a similar question in another topic and shows structured related topics", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/fa/topics/2022-nov-a");
  await expect(page.getByText(messages.library.olderShort, { exact: true })).toBeVisible();
  const related = page.getByRole("region", { name: study.related });
  await expect(related.locator('a[href="/fa/topics/2024-maj-b"]')).toBeVisible();

  const link = page.locator('a[href="/fa/topics/2023-maj-b#sitA"]');
  await link.click();
  await expect(page).toHaveURL("/fa/topics/2023-maj-b#sitA");
  const heading = page.locator("[data-study-topic]:visible #sitA");
  await expect(heading).toBeFocused();
  await expect(heading).toBeInViewport();
});

for (const colorScheme of ["light", "dark"] satisfies ("light" | "dark")[]) {
  test(`passes axe with study disclosures open in ${colorScheme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await page.goto(topicUrl);
    const a = page.locator('section[data-study-section="sitA"]:visible');
    await a.getByRole("button", { name: study.introText }).click();
    await a.getByRole("button", { name: study.translation, exact: true }).nth(1).click();
    await a.getByRole("button", { name: study.sample, exact: true }).click();
    await expect(a.getByRole("button", { name: study.playSample })).toBeVisible();
    await a.getByRole("button", { name: study.example, exact: true }).click();
    await a.getByRole("button", { name: study.shortAnswer, exact: true }).first().click();
    // Let disclosure fade-ins finish: axe measures blended colours mid-transition.
    await page.waitForFunction(() => document.getAnimations().every((animation) => animation.playState !== "running"));

    const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
    expect(results.violations).toEqual([]);
  });
}
