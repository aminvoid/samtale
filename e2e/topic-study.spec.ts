import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import messages from "../messages/fa.json" with { type: "json" };
import { AXE_TAGS, expect, test } from "./fixtures";

const topicUrl = "/fa/topics/2024-maj-b";
const { audio, study } = messages;

declare global {
  interface Window {
    studyPlayback?: { media: HTMLMediaElement; fail: () => void; end: () => void };
  }
}

async function stubPlayback(page: Page, firstPlay: "ok" | "blocked" | "loading" = "ok") {
  await page.route("**/audio/**", (route) => route.abort());
  await page.addInitScript((firstPlay) => {
    const times = new WeakMap<HTMLMediaElement, number>();
    const playing = new WeakSet<HTMLMediaElement>();
    const ended = new WeakSet<HTMLMediaElement>();
    const failed = new WeakSet<HTMLMediaElement>();
    let nextPlay = firstPlay;

    Object.defineProperties(HTMLMediaElement.prototype, {
      src: {
        get(this: HTMLMediaElement) {
          return this.getAttribute("src") ?? "";
        },
        set(this: HTMLMediaElement, source: string) {
          failed.delete(this);
          ended.delete(this);
          times.set(this, 0);
          this.setAttribute("src", source);
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
      error: {
        get(this: HTMLMediaElement) {
          return failed.has(this) ? { code: 2, message: "Fixture media loading error" } : null;
        },
      },
      ended: {
        get(this: HTMLMediaElement) {
          return ended.has(this);
        },
      },
      play: {
        value(this: HTMLMediaElement) {
          window.studyPlayback = {
            media: this,
            fail: () => {
              failed.add(this);
              playing.delete(this);
              this.dispatchEvent(new Event("error"));
            },
            end: () => {
              ended.add(this);
              playing.delete(this);
              this.currentTime = this.duration;
              this.dispatchEvent(new Event("ended"));
            },
          };
          const result = nextPlay;
          nextPlay = "ok";
          if (result === "blocked")
            return Promise.reject(new DOMException("Playback denied", "NotAllowedError"));
          if (result === "loading" || failed.has(this)) return Promise.resolve();
          playing.add(this);
          if (this.currentTime === 0) this.currentTime = 0.1;
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
  }, firstPlay);
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
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");

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
  const playSample = a.getByRole("button", { name: study.playSample, exact: true });
  await playSample.click();
  const highlight = a.locator('p[lang="da"][dir="ltr"] .bg-highlight');
  await expect(highlight).toBeVisible();
  await expect(question).toHaveAttribute("aria-pressed", "false");

  const rates = a.getByRole("radiogroup", { name: audio.speed }).getByRole("radio");
  await rates.nth(0).click();
  await expect(rates.nth(0)).toBeChecked();
  await expect.poll(() => page.evaluate(() => window.studyPlayback?.media.playbackRate)).toBe(0.75);

  const word = await highlight.innerText();
  await playSample.click();
  await expect(playSample).toHaveAttribute("aria-pressed", "false");
  await expect(highlight).toHaveText(word);

  const scrubber = a.getByRole("slider", { name: audio.position });
  const beforeSeek = await page.evaluate(() => window.studyPlayback?.media.currentTime ?? 0);
  await scrubber.press("ArrowRight");
  await expect
    .poll(() => page.evaluate(() => window.studyPlayback?.media.currentTime ?? 0))
    .toBeGreaterThan(beforeSeek);

  await rates.nth(2).click();
  await expect(rates.nth(2)).toBeChecked();
  await expect.poll(() => page.evaluate(() => window.studyPlayback?.media.playbackRate)).toBe(1.25);

  await question.click();
  await expect(question).toHaveAttribute("aria-pressed", "true");
  await expect.poll(() => page.evaluate(() => window.studyPlayback?.media.playbackRate)).toBe(1.25);
  await playSample.click();
  await expect(highlight).toBeVisible();
  await page.evaluate(() => window.studyPlayback?.end());
  await expect(playSample).toHaveAttribute("aria-pressed", "false");
  await expect(highlight).toHaveCount(0);

  const aloud = a.getByRole("link", { name: study.answerAloud }).first();
  await aloud.click();
  await expect(a.getByText(study.answerComingSoon).first()).toBeVisible();
  await a.getByRole("button", { name: study.answerDone }).click();
  await expect(a.getByText(study.practiceSaved, { exact: true }).first()).toBeVisible();
  await page.reload();
  await expect(page.getByText(/بار تمرین کرده‌اید/)).toBeVisible();
  await sample.click();
  await expect(rates.nth(2)).toBeChecked();
  await playSample.click();
  await expect(playSample).toHaveAttribute("aria-pressed", "true");
  await expect.poll(() => page.evaluate(() => window.studyPlayback?.media.playbackRate)).toBe(1.25);
  await page.getByRole("main").locator('a[href="/fa/topics/themes/arbejde"]').click();
  await expect(page).toHaveURL("/fa/topics/themes/arbejde");
  await expect
    .poll(() =>
      page.evaluate(() => {
        const media = window.studyPlayback?.media;
        return media === undefined ? null : { paused: media.paused, source: media.getAttribute("src") };
      }),
    )
    .toEqual({ paused: true, source: null });
});

for (const failure of ["blocked", "loading"] satisfies ("blocked" | "loading")[]) {
  test(`keeps the intro transcript and control name through ${failure} playback and retry`, async ({
    page,
  }) => {
    await stubPlayback(page, failure);
    await page.goto(topicUrl);
    const situation = page.locator('section[data-study-section="sitA"]:visible');
    const transcript = situation.locator('p[lang="da"][dir="ltr"].text-da-intro');
    const play = situation.getByRole("button", { name: study.playIntro, exact: true });
    await expect(transcript).toBeVisible();
    const text = await transcript.innerText();
    await expect(play).toHaveAttribute("aria-pressed", "false");
    await play.click();
    if (failure === "loading") {
      await expect(play).toHaveAttribute("aria-busy", "true");
      await expect(transcript).toBeVisible();
      await page.evaluate(() => window.studyPlayback?.fail());
    }
    await expect(play).toHaveAccessibleDescription(audio.playbackFailed);
    await expect(transcript).toBeVisible();
    await expect(transcript).toHaveText(text);
    await play.click();
    await expect(play).toHaveAttribute("aria-pressed", "true");
    await expect(play).not.toHaveAttribute("aria-describedby");
    await expect(transcript).toBeVisible();
    await expect(transcript).toHaveText(text);
    await play.click();
    await expect(play).toHaveAttribute("aria-pressed", "false");
    await expect(transcript).toBeVisible();
  });
}

test("keeps study controls usable when IndexedDB is blocked", async ({ page }) => {
  await stubPlayback(page);
  await page.addInitScript(() => {
    Object.defineProperty(IDBFactory.prototype, "open", {
      value() {
        throw new DOMException("IndexedDB blocked", "SecurityError");
      },
    });
  });
  await page.goto(topicUrl);

  const layout = page.getByRole("button", { name: study.layoutTitle, exact: true });
  await expect(layout).toHaveAttribute("aria-expanded", "true");
  await layout.click();
  await expect(layout).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByText(study.layoutBody)).toBeHidden();
  await layout.click();
  await expect(page.getByText(study.layoutBody)).toBeVisible();
  await layout.click();

  const situation = page.locator('section[data-study-section="sitA"]:visible');
  const sample = situation.getByRole("heading", { level: 3, name: study.sample }).getByRole("button");
  const rates = situation.getByRole("radiogroup", { name: audio.speed }).getByRole("radio");
  await sample.click();
  await rates.nth(0).click();
  await expect(rates.nth(0)).toBeChecked();
  await situation.getByRole("button", { name: study.playQuestion, exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.studyPlayback?.media.playbackRate)).toBe(0.75);

  await situation.getByRole("link", { name: study.answerAloud }).first().click();
  await situation.getByRole("button", { name: study.answerDone }).click();
  await expect(situation.getByText(study.practiceSaveFailed)).toBeVisible();
  await expect(page.getByText(study.practiceSaved, { exact: true })).toHaveCount(0);
  await expect(page.getByText(study.reviewSaved, { exact: true })).toHaveCount(0);
  await expect(page.getByText(/بار تمرین کرده‌اید/)).toHaveCount(0);

  await page.reload();
  await expect(layout).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByText(/بار تمرین کرده‌اید/)).toHaveCount(0);
  await sample.click();
  await expect(rates.nth(1)).toBeChecked();
});

for (const reducedMotion of ["no-preference", "reduce"] satisfies ("no-preference" | "reduce")[]) {
  test(`scrolls to and focuses a section with reduced motion set to ${reducedMotion}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion });
    await page.goto(topicUrl);
    const navigation = page.getByRole("navigation", { name: study.sectionNav });
    const general = page.getByRole("heading", { level: 2, name: study.generalHeading });
    await general.evaluate((heading) => {
      const scrollIntoView = heading.scrollIntoView.bind(heading);
      heading.scrollIntoView = (options) => {
        if (heading instanceof HTMLElement && typeof options === "object") {
          heading.dataset.testScrollBehavior = options.behavior;
        }
        scrollIntoView(options);
      };
    });
    await navigation.getByRole("link", { name: study.general, exact: true }).click();
    await expect(general).toBeFocused();
    await expect(general).toHaveAttribute(
      "data-test-scroll-behavior",
      reducedMotion === "reduce" ? "instant" : "smooth",
    );
    await expect(general).toBeInViewport();
  });
}

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
  await expect(general).toBeInViewport();
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
    await expect(a.locator('p[lang="da"][dir="ltr"].text-da-intro')).toBeVisible();
    await a.getByRole("button", { name: study.translation, exact: true }).nth(1).click();
    await a.getByRole("button", { name: study.sample, exact: true }).click();
    await expect(a.getByRole("button", { name: study.playSample })).toBeVisible();
    await a.getByRole("button", { name: study.example, exact: true }).click();
    await a.getByRole("button", { name: study.shortAnswer, exact: true }).first().click();
    // Let disclosure fade-ins finish: axe measures blended colours mid-transition.
    await page.waitForFunction(() =>
      document.getAnimations().every((animation) => animation.playState !== "running"),
    );

    const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
    expect(results.violations).toEqual([]);
  });
}
