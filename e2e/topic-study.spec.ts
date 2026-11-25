import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import messages from "../messages/fa.json" with { type: "json" };
import { AXE_TAGS, expect, test, waitForHydration } from "./fixtures";

const topicUrl = "/fa/topics/2024-maj-b";
const { audio, mock, study } = messages;
const { speaking } = study;

declare global {
  interface Window {
    studyPlayback?: { media: HTMLMediaElement; fail: () => void; end: () => void };
    studyTracks?: MediaStreamTrack[];
    studyRevokedUrls?: string[];
    studyRecordedChunks?: number;
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

async function openSpeakingExercise(page: Page) {
  const section = page.locator('section[data-study-section="sitA"]:visible');
  const start = section.getByRole("button", { name: study.answerAloud, exact: true }).first();
  await waitForHydration(start);
  await start.click();
  const dialog = page.getByRole("dialog", { name: study.answerAloud });
  await expect(dialog.getByText(speaking.listening)).toBeVisible();
  await page.evaluate(() => window.studyPlayback?.end());
  return dialog;
}

test("opens a topic from the library, plays clips, and reveals the translation and sample answer", async ({
  page,
}) => {
  await stubPlayback(page);
  await page.goto("/fa/topics/themes/arbejde");
  const topic = page.getByRole("main").locator(`a[href="${topicUrl}"]`);
  const title = await topic.locator('[lang="da"]').first().innerText();
  await waitForHydration(topic);
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

  const exercise = await openSpeakingExercise(page);
  await exercise.getByRole("button", { name: mock.ready.micSkip }).click();
  await exercise.getByRole("button", { name: study.answerDone }).click();
  await expect(exercise.getByText(study.practiceSaved, { exact: true })).toBeVisible();
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

test("records with Chromium fake media, compares, replaces the take, and releases local media", async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== "chromium", "Chromium fake microphone integration");
  await stubPlayback(page);
  await page.addInitScript(() => {
    const tracks: MediaStreamTrack[] = [];
    const revoked: string[] = [];
    window.studyTracks = tracks;
    window.studyRevokedUrls = revoked;
    let recordedChunks = 0;
    window.studyRecordedChunks = recordedChunks;
    window.MediaRecorder = class extends MediaRecorder {
      override start(timeslice?: number) {
        this.addEventListener("dataavailable", ({ data }) => {
          if (data.size > 0) window.studyRecordedChunks = ++recordedChunks;
        });
        super.start(timeslice);
      }
    };
    const request = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = async (options) => {
      const stream = await request(options);
      tracks.push(...stream.getTracks());
      return stream;
    };
    const revoke = URL.revokeObjectURL.bind(URL);
    URL.revokeObjectURL = (url) => {
      revoked.push(url);
      revoke(url);
    };
  });
  const requestsWithBodies: string[] = [];
  page.on("request", (request) => {
    if (request.postDataBuffer() !== null) requestsWithBodies.push(request.url());
  });
  await page.clock.install();
  await page.goto(topicUrl);
  const exercise = await openSpeakingExercise(page);
  await expect(exercise.getByText(speaking.privacy)).toBeVisible();
  await expect(exercise.locator('p[lang="da"][dir="ltr"]')).toBeVisible();
  await expect(exercise.getByRole("button", { name: speaking.next })).toHaveCount(0);
  await expect(exercise.getByRole("button", { name: study.playSample })).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => window.studyTracks?.length)).toBe(0);

  await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 30_000);
  await exercise.getByRole("button", { name: mock.ready.micAllow }).click();
  const recording = exercise.getByRole("status").filter({ hasText: speaking.recording });
  const done = exercise.getByRole("button", { name: study.answerDone });
  const take = exercise.getByRole("button", { name: speaking.playTake });
  const elapsed = exercise.getByRole("timer", { name: speaking.elapsed });
  await expect(recording).toBeVisible();
  // Native MediaRecorder still needs to produce audio independently of the page clock.
  await expect.poll(() => page.evaluate(() => window.studyRecordedChunks ?? 0)).toBeGreaterThan(0);
  await page.clock.runFor(1000);
  await expect(elapsed).toHaveText("۰:۰۱");
  await done.press("Enter");
  await expect(take).toBeFocused();
  await expect(done).toHaveCount(0);
  await expect(exercise.getByRole("button", { name: speaking.next })).toBeVisible();
  await take.press("Space");
  await expect(take).toHaveAttribute("aria-pressed", "true");
  const blob = await page.evaluate(() => window.studyPlayback?.media.getAttribute("src"));
  expect(blob).toMatch(/^blob:/);
  await exercise.getByRole("button", { name: study.playSample }).click();
  await expect(take).toHaveAttribute("aria-pressed", "false");
  await expect(exercise.getByText(study.practiceSaved, { exact: true })).toBeVisible();

  const chunksBeforeRetake = await page.evaluate(() => window.studyRecordedChunks ?? 0);
  await exercise.getByRole("button", { name: speaking.again }).click();
  await expect(exercise.getByText(speaking.listening)).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.studyRevokedUrls)).toContain(blob);
  await page.evaluate(() => window.studyPlayback?.end());
  await expect(recording).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => window.studyRecordedChunks ?? 0))
    .toBeGreaterThan(chunksBeforeRetake);
  await page.clock.runFor(1000);
  await expect(elapsed).toHaveText("۰:۰۱");
  await done.click();
  await page.clock.resume();
  await expect(take).toBeFocused();
  await take.click();
  const replacement = await page.evaluate(() => window.studyPlayback?.media.getAttribute("src"));
  expect(replacement).toMatch(/^blob:/);
  expect(replacement).not.toBe(blob);

  await exercise.getByRole("button", { name: speaking.close }).click();
  const discard = page.getByRole("dialog", { name: speaking.discardTitle });
  await expect(discard.getByRole("button", { name: speaking.stay })).toBeFocused();
  await discard.getByRole("button", { name: speaking.leave }).click();
  await expect(exercise).toBeHidden();
  await expect.poll(() => page.evaluate(() => window.studyRevokedUrls)).toContain(replacement);
  await expect
    .poll(() => page.evaluate(() => window.studyTracks?.map((track) => track.readyState)))
    .toEqual(["ended", "ended"]);
  expect(requestsWithBodies).toEqual([]);
  await page.reload();
  await expect(page.getByText(/۱ بار تمرین کرده‌اید/)).toBeVisible();
});

test("closes answer aloud with Back and keeps the same topic document on Forward", async ({ page }) => {
  await stubPlayback(page);
  await page.goto(topicUrl);
  const exercise = await openSpeakingExercise(page);
  await expect(exercise.getByRole("button", { name: mock.ready.micSkip })).toBeVisible();
  await page.evaluate(() => {
    document.documentElement.dataset.studyDocument = "original";
  });
  const navigations: string[] = [];
  page.on("request", (request) => {
    if (request.isNavigationRequest()) navigations.push(request.url());
  });

  await page.goBack();
  await expect(exercise).toBeHidden();
  await expect(page).toHaveURL(topicUrl);
  await page.goForward();
  await expect(exercise).toBeHidden();
  await expect(page).toHaveURL(topicUrl);
  await expect
    .poll(() =>
      page.evaluate(() => {
        const state: unknown = window.history.state;
        return typeof state === "object" && state !== null && "__NA" in state && state.__NA === true;
      }),
    )
    .toBe(true);
  await openSpeakingExercise(page);
  await expect(page.locator("html")).toHaveAttribute("data-study-document", "original");
  expect(navigations).toEqual([]);
});

test("continues after microphone denial and offers a retry without prompting again", async ({ page }) => {
  await stubPlayback(page);
  await page.addInitScript(() => {
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
      value: () => Promise.reject(new DOMException("Permission denied", "NotAllowedError")),
    });
  });
  await page.goto(topicUrl);
  const exercise = await openSpeakingExercise(page);
  await exercise.getByRole("button", { name: mock.ready.micAllow }).click();
  await expect(exercise.getByText(speaking.micDenied)).toBeVisible();
  await expect(exercise.getByRole("button", { name: speaking.micRetry })).toBeVisible();
  await exercise.getByRole("button", { name: study.answerDone }).click();
  await expect(exercise.getByRole("button", { name: study.playSample })).toBeFocused();
  await expect(exercise.getByText(speaking.noTake)).toBeVisible();
  await exercise.getByRole("button", { name: speaking.again }).click();
  await page.evaluate(() => window.studyPlayback?.end());
  await expect(exercise.getByText(speaking.micDenied)).toBeVisible();
  await expect(exercise.getByRole("button", { name: mock.ready.micAllow })).toHaveCount(0);
});

test("WebKit can compare a response when MediaRecorder is unavailable", async ({ page, browserName }) => {
  test.skip(browserName !== "webkit", "WebKit fallback");
  await stubPlayback(page);
  await page.addInitScript(() => Object.defineProperty(window, "MediaRecorder", { value: undefined }));
  await page.goto(topicUrl);
  const exercise = await openSpeakingExercise(page);
  await exercise.getByRole("button", { name: mock.ready.micAllow }).click();
  await expect(exercise.getByText(mock.ready.micUnavailable)).toBeVisible();
  await exercise.getByRole("button", { name: study.answerDone }).click();
  await expect(exercise.getByRole("button", { name: study.playSample })).toBeFocused();
  await expect(exercise.getByText(study.practiceSaved, { exact: true })).toBeVisible();
  await page.goBack();
  await expect(exercise).toBeHidden();
  await expect(page).toHaveURL(topicUrl);
});

for (const width of [375, 1280]) {
  test(`keeps the comparison keyboard-accessible in RTL at ${String(width)}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 812 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await stubPlayback(page);
    await page.goto(topicUrl);
    const exercise = await openSpeakingExercise(page);
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await exercise.getByRole("button", { name: mock.ready.micSkip }).click();
    await exercise.getByRole("button", { name: study.answerDone }).press("Enter");
    const play = exercise.getByRole("button", { name: study.playSample });
    await expect(play).toBeFocused();
    const target = await play.boundingBox();
    expect(target?.height).toBeGreaterThanOrEqual(44);
    expect(target?.width).toBeGreaterThanOrEqual(44);
    await expect(exercise.locator('p[lang="da"][dir="ltr"]')).toBeVisible();
    expect(await exercise.evaluate((element) => element.scrollWidth)).toBeLessThanOrEqual(width);
    // Base UI's dialog focus guards are hidden role="button" spans without a name (also excluded in the library and mock tests).
    const { violations } = await new AxeBuilder({ page })
      .withTags(AXE_TAGS)
      .exclude("[data-base-ui-focus-guard]")
      .analyze();
    expect(violations).toEqual([]);
  });
}

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

  const exercise = await openSpeakingExercise(page);
  await exercise.getByRole("button", { name: mock.ready.micSkip }).click();
  await exercise.getByRole("button", { name: study.answerDone }).click();
  await expect(exercise.getByText(study.practiceSaveFailed)).toBeVisible();
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
  test(`passes axe with study answers and translations open in ${colorScheme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await page.goto("/fa/topics/2016-nov-c");
    const a = page.locator('section[data-study-section="sitA"]:visible');
    const b = page.locator('section[data-study-section="sitB"]:visible');
    await expect(a.locator('p[lang="da"][dir="ltr"].text-da-intro')).toBeVisible();
    const questionTranslation = a.getByRole("button", { name: study.translation, exact: true }).nth(1);
    await waitForHydration(questionTranslation);
    await questionTranslation.click();

    for (const { section, heading, name } of [
      { section: a, heading: study.sample, name: study.sampleTranslation },
      { section: a, heading: study.shortAnswer, name: study.shortAnswerTranslation },
      { section: b, heading: study.example, name: study.exampleTranslation },
    ]) {
      const answer = section.getByRole("heading", { name: heading, exact: true });
      await answer.getByRole("button").click();
      const disclosure = answer.locator("..");
      const toggle = disclosure.getByRole("button", { name, exact: true });
      const persian = disclosure.locator('p[lang="fa"][dir="rtl"]');
      const danish = disclosure.locator('p[lang="da"]');
      await expect(toggle).toHaveAttribute("aria-expanded", "false");
      await expect(persian).toBeHidden();
      await toggle.press("Enter");
      await expect(toggle).toHaveAttribute("aria-expanded", "true");
      await expect(persian).toBeVisible();
      await expect(disclosure.getByText(study.answerTranslationSource, { exact: true })).toBeVisible();
      await expect(danish).toBeVisible();
      await expect(danish).toHaveAttribute("dir", "ltr");
    }

    // Let disclosure fade-ins finish: axe measures blended colours mid-transition.
    await page.waitForFunction(() =>
      document.getAnimations().every((animation) => animation.playState !== "running"),
    );

    const results = await new AxeBuilder({ page })
      .withTags(AXE_TAGS)
      .exclude("[data-base-ui-focus-guard]")
      .analyze();
    expect(results.violations).toEqual([]);

    const sampleTranslation = a.getByRole("button", { name: study.sampleTranslation, exact: true });
    await sampleTranslation.press("Space");
    await expect(sampleTranslation).toHaveAttribute("aria-expanded", "false");
    await expect(a.getByText(study.answerTranslationSource, { exact: true }).first()).toBeHidden();
  });
}
