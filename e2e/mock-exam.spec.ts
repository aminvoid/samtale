import AxeBuilder from "@axe-core/playwright";
import type { Page, TestInfo } from "@playwright/test";
import { createTranslator } from "next-intl";
import messages from "../messages/fa.json" with { type: "json" };
import { buildFormats } from "../src/i18n/formats";
import { examConfig } from "../src/lib/exam/config";
import { InProgressMarkerSchema } from "../src/lib/progress/schema";
import { AXE_TAGS, expect, test, denyMicrophone } from "./fixtures";

/**
 * Mock exam journeys (US-026 to US-045). Deterministic journeys stub examiner playback.
 * Native integration tests below exercise the real media element and MediaRecorder.
 */

const { mock, study } = messages;
const t = createTranslator({ locale: "fa", messages, formats: buildFormats("fa") });
const cardNames = [1, 2, 3].map((number) => t("mock.draw.card", { number, total: 3 }));
const anyCardName = new RegExp(`^(?:${cardNames.map((name) => RegExp.escape(name)).join("|")})$`);
const clock = (seconds: number) =>
  t("audio.clock", { minutes: Math.floor(seconds / 60), seconds: seconds % 60 });
const recordingTimes = new Set([1, 2, 3].map(clock));
const durationLabel = (key: "mock.review.total" | "mock.review.length") =>
  new RegExp(`^${RegExp.escape(t.markup(key, { time: "", ltr: (text) => text }).trim())}`);
const SHOTS = "test-results/mock";
const markerKey = "pd3:mock:in-progress:v1";
// Text queries use `filter({ visible: true })`: with Cache Components the previous route stays
// mounted but hidden (React Activity), and getByText, unlike getByRole, also matches hidden nodes.

async function stubExaminer(page: Page) {
  // Preload fetches every clip; a few bytes are enough because playback itself is stubbed.
  await page.route("**/audio/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "audio/mpeg",
      body: Buffer.from([0xff, 0xfb, 0x90, 0x00]),
    }),
  );
  await page.addInitScript(() => {
    const times = new WeakMap<HTMLMediaElement, number>();
    const playing = new WeakSet<HTMLMediaElement>();
    const ended = new WeakSet<HTMLMediaElement>();
    Object.defineProperties(HTMLMediaElement.prototype, {
      src: {
        get(this: HTMLMediaElement) {
          return this.getAttribute("src") ?? "";
        },
        set(this: HTMLMediaElement, source: string) {
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
      duration: { get: () => 2 },
      paused: {
        get(this: HTMLMediaElement) {
          return !playing.has(this);
        },
      },
      error: { get: () => null },
      ended: {
        get(this: HTMLMediaElement) {
          return ended.has(this);
        },
      },
      play: {
        value(this: HTMLMediaElement) {
          ended.delete(this);
          playing.add(this);
          if (this.currentTime === 0) this.currentTime = 0.1;
          this.dispatchEvent(new Event("playing"));
          const source = this.getAttribute("src");
          window.setTimeout(() => {
            if (!playing.has(this) || this.getAttribute("src") !== source) return;
            playing.delete(this);
            ended.add(this);
            this.currentTime = this.duration;
            this.dispatchEvent(new Event("ended"));
          }, 40);
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

async function seedDraw(page: Page) {
  await page.addInitScript(() => {
    const random = crypto.getRandomValues.bind(crypto);
    // In these isolated test pages only the mock runtime's draw seed uses one Uint32.
    // The attempt's 16-byte ID and the progress store's randomUUID() retain native randomness.
    crypto.getRandomValues = <T extends Exclude<BufferSource, ArrayBuffer>>(bytes: T) => {
      if (bytes instanceof Uint32Array && bytes.length === 1) {
        bytes[0] = 1;
        return bytes;
      }
      return random(bytes);
    };
  });
}

declare global {
  interface Window {
    mockExamTracks?: MediaStreamTrack[];
    mockExamAudio?: HTMLMediaElement;
    mockExamStartActivated?: boolean;
  }
}

async function observeMicrophone(page: Page, synthetic: boolean) {
  await page.addInitScript(
    ({ synthetic, allow }) => {
      const tracks: MediaStreamTrack[] = [];
      window.mockExamTracks = tracks;
      if (!Reflect.has(navigator, "mediaDevices")) return;
      const devices = navigator.mediaDevices;
      if (typeof devices.getUserMedia !== "function") return;
      const native = devices.getUserMedia.bind(devices);
      let audio: AudioContext | undefined;
      if (synthetic) {
        // Resume Web Audio from the learner's trusted permission-check tap.
        document.addEventListener(
          "click",
          (event) => {
            if (audio || !(event.target instanceof Element)) return;
            if (event.target.closest("button")?.textContent.trim() !== allow) return;
            audio = new AudioContext();
            void audio.resume();
          },
          true,
        );
      }
      Object.defineProperty(devices, "getUserMedia", {
        value: async (constraints: MediaStreamConstraints) => {
          let stream: MediaStream;
          if (audio) {
            const tone = audio.createOscillator();
            const dest = audio.createMediaStreamDestination();
            tone.connect(dest);
            tone.start();
            stream = dest.stream;
          } else {
            stream = await native(constraints);
          }
          tracks.push(...stream.getTracks());
          return stream;
        },
      });
    },
    { synthetic, allow: mock.ready.micAllow },
  );
}

async function assertTracksReleased(page: Page) {
  await expect
    .poll(() => page.evaluate(() => window.mockExamTracks?.map(({ readyState }) => readyState)))
    .toEqual(["ended"]);
}

// A locally fulfilled PCM clip gives the actual media element supported, predictable input.
function wave() {
  const size = 2 * 8000 * 2;
  const body = Buffer.alloc(44 + size);
  body.write("RIFF", 0);
  body.writeUInt32LE(body.length - 8, 4);
  body.write("WAVEfmt ", 8);
  body.writeUInt32LE(16, 16);
  body.writeUInt16LE(1, 20);
  body.writeUInt16LE(1, 22);
  body.writeUInt32LE(8000, 24);
  body.writeUInt32LE(16_000, 28);
  body.writeUInt16LE(2, 32);
  body.writeUInt16LE(16, 34);
  body.write("data", 36);
  body.writeUInt32LE(size, 40);
  return body;
}

/**
 * Whether real playback progresses on this host. The Chromium projects use a fake audio sink
 * (`--disable-audio-output`), so their media clock always runs. WebKit has no fake sink: without a
 * usable output device (a locked or non-GUI session, some CI hosts) playback reports "playing" but
 * `currentTime` never advances, so no clip ever ends. Probed in a separate page, so the test page's
 * routes and play() wrappers are untouched.
 */
async function mediaClockRuns(page: Page) {
  const probe = await page.context().newPage();
  try {
    return await probe.evaluate(
      async (bytes) => {
        const audio = new Audio(
          URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: "audio/wav" })),
        );
        audio.muted = true;
        // A rejected play() (WebKit can abort it without an output device) means no running clock.
        if (
          !(await audio.play().then(
            () => true,
            () => false,
          ))
        )
          return false;
        await new Promise((resolve) => setTimeout(resolve, 500));
        audio.pause();
        return audio.currentTime > 0.2;
      },
      [...wave()],
    );
  } finally {
    await probe.close();
  }
}

const NO_AUDIO_OUTPUT = "No usable audio output on this host: the media clock does not advance";

/** axe in the light and the dark theme, then back to light. */
async function expectAccessible(page: Page) {
  for (const colorScheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme });
    // Switching the scheme starts colour transitions; scan the settled colours, not a blend.
    await page.waitForFunction(() =>
      document
        .getAnimations()
        .every(
          (animation) =>
            animation.playState !== "running" || animation.effect?.getTiming().iterations === Infinity,
        ),
    );
    // Base UI's modal focus guards get role="button" without a name on WebKit (library behaviour,
    // reported as a follow-up); everything else in the dialog is scanned.
    const results = await new AxeBuilder({ page })
      .withTags(AXE_TAGS)
      .exclude("[data-base-ui-focus-guard]")
      .analyze();
    expect(results.violations, `axe (${colorScheme})`).toEqual([]);
  }
  await page.emulateMedia({ colorScheme: "light" });
}

/** RTL, no horizontal scrolling, and a 375 px screenshot on the mobile Chromium project. */
async function checkScreen(page: Page, info: TestInfo, name: string) {
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, `horizontal overflow on ${name}`).toBeLessThanOrEqual(0);
  if (info.project.name === "mobile-chromium") {
    await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true });
  }
}

const primarySlot = (page: Page) => page.locator("[data-primary-slot]");

async function drawAndReveal(page: Page) {
  await expect(page.getByRole("heading", { level: 1, name: mock.draw.title })).toBeVisible();
  const cards = page.getByRole("button", { name: anyCardName });
  await expect(cards).toHaveCount(3);
  await cards.first().click();
  await expect(primarySlot(page)).toHaveText(mock.reveal.start);
  await expect(primarySlot(page)).toHaveAttribute("aria-disabled", "false");
  // The drawn-card thumbnails are native disabled, so they leave the tab order (a11y m8).
  const thumbnails = page.getByRole("button", { name: anyCardName });
  await expect(thumbnails).toHaveCount(3);
  for (const thumbnail of await thumbnails.all()) await expect(thumbnail).toBeDisabled();
}

/** Start from the keyboard and skip the look; focus must stay in the primary slot (UXD-08). */
async function startAndLook(page: Page) {
  await primarySlot(page).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText(mock.look.time).filter({ visible: true })).toBeVisible();
  await expect(page.getByText(mock.look.pictures).filter({ visible: true })).toBeVisible();
  await expect(primarySlot(page)).toBeFocused();
  await expect(primarySlot(page)).toHaveText(mock.look.ready);
}

/** Answers every question with Done (Enter on the focused primary slot) until the end view. */
async function answerAll(page: Page) {
  await page.keyboard.press("Enter");
  const primary = primarySlot(page);
  for (let answers = 0; answers < 12; answers++) {
    await expect(primary).toHaveText(new RegExp(`^(${mock.interview.done}|${mock.end.review})$`), {
      timeout: 15_000,
    });
    if ((await primary.innerText()).trim() === mock.end.review) return;
    await expect(primary).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(primary).not.toHaveText(mock.interview.done);
  }
  throw new Error("The mock exam did not reach the end view");
}

async function untilYourTurn(page: Page) {
  await page.keyboard.press("Enter");
  await expect(primarySlot(page)).toHaveText(mock.interview.done, { timeout: 15_000 });
  await expect(primarySlot(page)).toHaveAttribute("aria-disabled", "false");
}

async function continueToDraw(page: Page, record = false) {
  await page.getByRole("button", { name: record ? mock.ready.micAllow : mock.ready.micSkip }).click();
  if (record) await expect(page.getByText(mock.ready.micGranted).filter({ visible: true })).toBeVisible();
  await page.getByRole("button", { name: mock.ready.toDraw }).click();
}

async function finishEarly(page: Page) {
  await page.getByRole("button", { name: mock.leave, exact: true }).click();
  await page
    .getByRole("dialog", { name: mock.dialog.leaveTitle })
    .getByRole("button", { name: mock.dialog.endReview })
    .click();
  await expect(page).toHaveURL(/\/fa\/mock\/review\/[^/?]+\?attempt=/);
}

test("reveals a Persian sample answer translation on the mock review page", async ({ page }) => {
  await page.goto("/fa/mock/review/2016-nov-c");
  await expect(page.getByRole("link", { name: mock.review.study, exact: true })).toBeVisible();
  const sample = page.getByRole("heading", { name: mock.review.sample, exact: true }).first();
  const disclosure = sample.locator("..");
  const toggle = disclosure.getByRole("button", {
    name: t("mock.review.answerTranslation", { question: mock.examiner.first }),
    exact: true,
  });
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
  await expectAccessible(page);

  await toggle.press("Space");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(persian).toBeHidden();
});

test.describe("mock exam", () => {
  test.beforeEach(async ({ page }) => {
    await seedDraw(page);
    await stubExaminer(page);
  });

  test("states the exam-conditions rules before anything starts, practice first", async ({ page }, info) => {
    await page.goto("/fa/mock");
    const practice = page.getByRole("link", { name: mock.start.practice });
    const exam = page.getByRole("link", { name: mock.start.exam });
    await expect(practice).toBeVisible();
    const order = await page
      .getByRole("main")
      .locator("a[href]")
      .evaluateAll((links) => links.map((link) => link.getAttribute("href")));
    expect(order.indexOf("/fa/mock/practice")).toBeLessThan(order.indexOf("/fa/mock/exam"));
    const examCard = page.locator("section").filter({ has: exam });
    for (const rule of [
      mock.start.continuous,
      mock.start.notices,
      mock.start.interruptions,
      mock.start.alternative,
    ]) {
      await expect(examCard.getByText(rule).filter({ visible: true })).toBeVisible();
    }
    await expect(page.getByText(mock.start.noGrade).filter({ visible: true })).toBeVisible();
    await checkScreen(page, info, "01-start");
    await expectAccessible(page);

    await exam.click();
    await expect(page).toHaveURL(/\/fa\/mock\/exam$/);
    await expect(page.getByRole("heading", { level: 1, name: mock.ready.exam })).toBeVisible();
    await expect(page.getByText(mock.start.continuous).filter({ visible: true })).toBeVisible();
    await expect(page.getByText(mock.start.interruptions).filter({ visible: true })).toBeVisible();
    await expect(page.getByText(mock.ready.dnd).filter({ visible: true })).toBeVisible();
    await expect(page.getByText(mock.ready.headphones).filter({ visible: true })).toBeVisible();
    await expect(page.getByRole("link", { name: mock.ready.usePractice })).toBeVisible();
    await checkScreen(page, info, "02b-get-ready-exam");
    await expectAccessible(page);
  });

  test("runs a full practice mock: draw, look, answers with Done, closing, review", async ({
    page,
    browserName,
  }, info) => {
    test.slow();
    if (info.project.name === "mobile-chromium") await page.setViewportSize({ width: 375, height: 812 });
    const record = browserName === "chromium";

    await page.goto("/fa/mock/practice");
    await expect(page.getByRole("heading", { level: 1, name: mock.ready.practice })).toBeVisible();
    await expect(page.getByText(mock.ready.headphones).filter({ visible: true })).toBeVisible();
    await expect(page.getByText(mock.ready.micExplanation).filter({ visible: true })).toBeVisible();
    await expect(page.getByText(mock.ready.continueBlocked).filter({ visible: true })).toBeVisible();
    await page.getByRole("button", { name: mock.ready.play }).click();
    await page.getByRole("button", { name: mock.ready.heard }).click();
    await expect(page.getByText(mock.ready.soundOk).filter({ visible: true })).toBeVisible();
    await checkScreen(page, info, "02-get-ready");
    await expectAccessible(page);

    if (record) {
      await page.getByRole("button", { name: mock.ready.micAllow }).click();
      await expect(page.getByText(mock.ready.micGranted).filter({ visible: true })).toBeVisible();
    } else {
      await page.getByRole("button", { name: mock.ready.micSkip }).click();
    }
    await page.getByRole("button", { name: mock.ready.toDraw }).click();

    await expect(page.getByRole("heading", { level: 1, name: mock.draw.title })).toBeVisible();
    await checkScreen(page, info, "03-draw");
    await expectAccessible(page);
    await drawAndReveal(page);
    // The reveal is announced through the live region, with the Danish topic name tagged.
    await expect(page.locator('[role="status"][aria-live="polite"] [lang="da"]').first()).toBeAttached();
    await expect(page.getByText(mock.reveal.letter).filter({ visible: true })).toBeVisible();
    await checkScreen(page, info, "04-reveal");
    await expectAccessible(page);

    await startAndLook(page);
    await expect(page.locator('h1 [lang="da"][dir="ltr"]')).toBeVisible();
    await checkScreen(page, info, "05-look");

    await untilYourTurn(page);
    await expect(
      page
        .getByText(record ? mock.interview.recording : mock.interview.notRecording)
        .filter({ visible: true }),
    ).toBeVisible();
    const repeat = page.getByRole("button", { name: mock.interview.repeat, exact: true });
    await expect(repeat).toHaveAccessibleDescription(/Undskyld, vil du godt gentage spørgsmålet\?/);
    await expect(page.getByText(mock.interview.doneHint).filter({ visible: true })).toBeVisible();
    await checkScreen(page, info, "06-answering");
    await expectAccessible(page);
    await primarySlot(page).focus();

    await answerAll(page);
    await expect(page.getByRole("heading", { level: 1, name: mock.end.title })).toBeVisible();
    await expect(page.getByText(durationLabel("mock.review.total")).filter({ visible: true })).toBeVisible();
    await checkScreen(page, info, "07-end");
    await expectAccessible(page);

    await primarySlot(page).click();
    await expect(page).toHaveURL(/\/fa\/mock\/review\/[^/?]+\?attempt=/);
    await expect(page.getByRole("heading", { level: 1, name: mock.review.title })).toBeVisible();
    await expect(page.getByRole("heading", { name: mock.review.sample }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: mock.review.yourAnswer }).first()).toBeVisible();
    const selfCheck = page.getByRole("group").filter({ hasText: mock.review.checkPrivate }).first();
    await expect(selfCheck).toBeVisible();
    const tick = selfCheck.getByRole("checkbox", { name: mock.review.check.gaveReason.label });
    await tick.check();
    await expect(tick).toBeChecked();
    if (record) {
      await expect(
        page.getByText(durationLabel("mock.review.length")).filter({ visible: true }).first(),
      ).toBeVisible();
      await expect(page.getByRole("switch", { name: mock.review.keep })).toBeVisible();
    } else {
      await expect(page.getByText(mock.review.notRecorded).filter({ visible: true }).first()).toBeVisible();
    }
    // No grade or score anywhere (GA-10).
    await expect(page.getByText(/نمره|امتیاز/).filter({ visible: true })).toHaveCount(0);
    await checkScreen(page, info, "08-review");
    await expectAccessible(page);
  });

  test("continues without recording when the microphone is denied", async ({ page }, info) => {
    test.slow();
    await denyMicrophone(page);
    await page.goto("/fa/mock/practice");
    await page.getByRole("button", { name: mock.ready.micAllow }).click();
    await expect(page.getByText(mock.ready.micDenied).filter({ visible: true })).toBeVisible();
    await checkScreen(page, info, "02c-get-ready-mic-denied");
    await expectAccessible(page);
    await page.getByRole("button", { name: mock.ready.continue, exact: true }).click();

    await drawAndReveal(page);
    await startAndLook(page);
    await untilYourTurn(page);
    await expect(page.getByText(mock.interview.notRecording).filter({ visible: true })).toBeVisible();
    await primarySlot(page).focus();
    await answerAll(page);
    await primarySlot(page).click();
    await expect(page.getByText(mock.review.notRecorded).filter({ visible: true }).first()).toBeVisible();
    await expect(page.getByText(mock.review.noTakeNote).filter({ visible: true })).toBeVisible();
  });

  test("WebKit continues when MediaRecorder is unavailable", async ({ page, browserName }) => {
    test.skip(browserName !== "webkit", "WebKit fallback");
    await page.addInitScript(() => Object.defineProperty(window, "MediaRecorder", { value: undefined }));
    await page.goto("/fa/mock/practice");
    await page.getByRole("button", { name: mock.ready.micAllow }).click();
    await expect(page.getByText(mock.ready.micUnavailable).filter({ visible: true })).toBeVisible();
    await page.getByRole("button", { name: mock.ready.continue, exact: true }).click();
    await drawAndReveal(page);
    await startAndLook(page);
    await untilYourTurn(page);
    await expect(page.getByText(mock.interview.notRecording).filter({ visible: true })).toBeVisible();
  });

  test("runs exam conditions through handover, the last minute and the finish with timers hidden", async ({
    page,
  }) => {
    await page.clock.install();
    await page.goto("/fa/mock/exam");
    await continueToDraw(page);
    await drawAndReveal(page);
    await primarySlot(page).click();
    await expect(page.getByText(mock.look.time).filter({ visible: true })).toBeVisible();
    await expect(primarySlot(page)).toHaveAttribute("aria-disabled", "true");
    await page.clock.fastForward(examConfig.lookSeconds * 1000);
    await expect(primarySlot(page)).toHaveText(mock.interview.done);
    const timers = page.getByRole("button", { name: mock.interview.timers });
    await timers.click();
    await expect(timers).toHaveAttribute("aria-pressed", "true");
    await page.clock.fastForward(examConfig.part1HandoverSeconds * 1000);
    await expect(
      page.getByText(mock.live.handover, { exact: true }).filter({ visible: true }).first(),
    ).toBeVisible();
    await primarySlot(page).click();
    await expect(
      page.getByText(t("mock.interview.secondStep", { current: 2, total: 2 })).filter({ visible: true }),
    ).toBeVisible();
    await expect(primarySlot(page)).toHaveText(mock.interview.done);
    await page.clock.fastForward(
      (examConfig.examLimitSeconds - examConfig.oneMinuteNoticeSeconds - examConfig.part1HandoverSeconds) *
        1000,
    );
    await expect(
      page.getByText(mock.live.oneMinuteLeft, { exact: true }).filter({ visible: true }).first(),
    ).toBeVisible();
    await page.clock.fastForward(examConfig.oneMinuteNoticeSeconds * 1000);
    await expect(
      page.getByText(mock.live.finishSentence, { exact: true }).filter({ visible: true }).first(),
    ).toBeVisible();
    await page.clock.fastForward(examConfig.graceSeconds * 1000);
    await expect(page.getByRole("heading", { level: 1, name: mock.end.title })).toBeVisible();
    await primarySlot(page).click();
    await expect(page.getByRole("heading", { name: mock.review.partSecond })).toBeVisible();
    await expect(page.getByText(mock.review.endedEarly).filter({ visible: true })).toHaveCount(0);
  });

  test("reload reports a lost attempt once and does not add it to history", async ({ page }) => {
    await page.goto("/fa/mock/practice");
    await continueToDraw(page);
    await drawAndReveal(page);
    await startAndLook(page);
    const marker = await page.evaluate((key) => sessionStorage.getItem(key), markerKey);
    if (marker === null) throw new Error("The running attempt did not leave a reload marker");
    const { attemptId, topicId } = InProgressMarkerSchema.parse(JSON.parse(marker));
    await page.reload();
    await expect(page.getByRole("heading", { name: mock.ready.reloadTitle })).toBeVisible();
    expect(await page.evaluate((key) => sessionStorage.getItem(key), markerKey)).toBeNull();
    await page.getByRole("button", { name: mock.ready.new }).click();
    await expect(page.getByRole("heading", { name: mock.ready.practice })).toBeVisible();
    await page.goto(`/fa/mock/review/${topicId}?attempt=${encodeURIComponent(attemptId)}`);
    await expect(page.getByText(mock.review.gone, { exact: true }).filter({ visible: true })).toBeVisible();
  });

  test("leaving mock routes silently removes a leftover reload marker", async ({ page }) => {
    await page.goto("/fa/mock/practice");
    await continueToDraw(page);
    await drawAndReveal(page);
    await startAndLook(page);
    expect(await page.evaluate((key) => sessionStorage.getItem(key), markerKey)).not.toBeNull();
    await page.goto("/fa/topics");
    await expect.poll(() => page.evaluate((key) => sessionStorage.getItem(key), markerKey)).toBeNull();
    await page.goto("/fa/mock/practice");
    await expect(page.getByRole("button", { name: mock.ready.micAllow })).toBeVisible();
    await expect(page.getByRole("heading", { name: mock.ready.reloadTitle })).toHaveCount(0);
  });

  test("browser Back keeps the attempt once an answer has begun", async ({ page }) => {
    await page.goto("/fa/mock");
    await page.getByRole("link", { name: mock.start.practice }).click();
    await continueToDraw(page);
    await drawAndReveal(page);
    await startAndLook(page);
    await untilYourTurn(page);
    await page.goBack();
    await expect(page).toHaveURL(/\/fa\/mock$/);
    await expect(page.getByText(mock.back.saved).filter({ visible: true })).toBeVisible();
    await page.getByRole("link", { name: mock.review.see }).click();
    await expect(page).toHaveURL(/\/fa\/mock\/review\/[^/?]+\?attempt=/);
    const endedEarly = page.getByText(mock.review.endedEarly, { exact: true }).filter({ visible: true });
    await expect(endedEarly).toBeVisible();
    await page.reload();
    await expect(endedEarly).toBeVisible();
    expect(await page.evaluate((key) => sessionStorage.getItem(key), markerKey)).toBeNull();
  });

  test("review still works when browser storage is unavailable", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, "indexedDB", { get: () => undefined });
      Object.defineProperty(window, "sessionStorage", {
        get() {
          throw new DOMException("Storage unavailable", "SecurityError");
        },
      });
    });
    await page.goto("/fa/mock/practice");
    await continueToDraw(page);
    await drawAndReveal(page);
    await startAndLook(page);
    await untilYourTurn(page);
    await finishEarly(page);
    await expect(page.getByText(mock.review.storage).filter({ visible: true })).toBeVisible();
    const tick = page.getByRole("checkbox", { name: mock.review.check.gaveReason.label });
    await tick.check();
    await expect(tick).toBeChecked();
    await page.reload();
    await expect(page.getByText(mock.review.gone).filter({ visible: true })).toBeVisible();
  });

  test("ends from the leave dialog and shows the answers so far", async ({ page }, info) => {
    test.slow();
    await page.goto("/fa/mock/practice");
    await page.getByRole("button", { name: mock.ready.micSkip }).click();
    await page.getByRole("button", { name: mock.ready.toDraw }).click();
    await drawAndReveal(page);
    await startAndLook(page);
    await untilYourTurn(page);

    if (info.project.name === "desktop-chromium") {
      // Short viewports (200% zoom, landscape) unpin both focused bars (a11y S3).
      await page.setViewportSize({ width: 1280, height: 420 });
      await expect(page.locator('[data-sticky="focused-header"]')).toHaveCSS("position", "static");
      await page.setViewportSize({ width: 1280, height: 800 });
      await expect(page.locator('[data-sticky="focused-header"]')).toHaveCSS("position", "sticky");
    }

    await page.getByRole("button", { name: mock.leave, exact: true }).click();
    const dialog = page.getByRole("dialog", { name: mock.dialog.leaveTitle });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(mock.dialog.leavePractice).filter({ visible: true })).toBeVisible();
    await expect(dialog.getByRole("button", { name: mock.interview.resume })).toBeFocused();
    await expect(dialog.getByRole("button", { name: mock.dialog.leaveWithout })).toBeVisible();
    await checkScreen(page, info, "06b-leave-dialog");
    await expectAccessible(page);

    await dialog.getByRole("button", { name: mock.dialog.endReview }).click();
    await expect(page).toHaveURL(/\/fa\/mock\/review\/[^/?]+\?attempt=/);
    await expect(page.getByRole("heading", { level: 1, name: mock.review.title })).toBeVisible();
    await expect(page.getByText(mock.review.endedEarly).filter({ visible: true })).toBeVisible();
    await expect(page.getByText(mock.review.notRecorded).filter({ visible: true }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: mock.review.partSecond })).toHaveCount(0);
  });
});

test.describe("native examiner audio", () => {
  test("starts playback in the Start gesture and recovers from a native pause", async ({ page }) => {
    test.skip(!(await mediaClockRuns(page)), NO_AUDIO_OUTPUT);
    await seedDraw(page);
    await page.route("**/audio/**", (route) => route.fulfill({ contentType: "audio/wav", body: wave() }));
    await page.addInitScript(() => {
      // eslint-disable-next-line @typescript-eslint/unbound-method -- The wrapper passes the original media element as this.
      const play = HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play = function (this: HTMLMediaElement) {
        window.mockExamAudio = this;
        window.mockExamStartActivated ??= navigator.userActivation.isActive;
        return play.call(this);
      };
    });
    await page.goto("/fa/mock/practice");
    await continueToDraw(page);
    await drawAndReveal(page);
    await primarySlot(page).click();
    const started = await page.waitForFunction(() => {
      const audio = window.mockExamAudio;
      if (!audio || audio.paused || audio.currentTime === 0) return false;
      audio.pause();
      return { activated: window.mockExamStartActivated };
    });
    expect(await started.jsonValue()).toEqual({ activated: true });
    const interrupted = page.getByRole("dialog", { name: mock.dialog.interruptedPractice });
    await expect(interrupted).toBeVisible();
    await interrupted.getByRole("button", { name: mock.interview.resume, exact: true }).last().click();
    await expect(primarySlot(page)).toHaveText(mock.look.ready);
    await primarySlot(page).click();
    await expect(primarySlot(page)).toHaveText(mock.interview.done, { timeout: 12_000 });
  });

  test("asks for another tap on play rejection and resumes with native audio", async ({ page }) => {
    test.skip(!(await mediaClockRuns(page)), NO_AUDIO_OUTPUT);
    await seedDraw(page);
    await page.route("**/audio/**", (route) => route.fulfill({ contentType: "audio/wav", body: wave() }));
    await page.addInitScript(() => {
      // eslint-disable-next-line @typescript-eslint/unbound-method -- The wrapper passes the original media element as this.
      const play = HTMLMediaElement.prototype.play;
      let blocked = true;
      HTMLMediaElement.prototype.play = function (this: HTMLMediaElement) {
        if (!blocked) return play.call(this);
        blocked = false;
        return Promise.reject(new DOMException("Gesture required", "NotAllowedError"));
      };
    });
    await page.goto("/fa/mock/practice");
    await continueToDraw(page);
    await drawAndReveal(page);
    await primarySlot(page).click();
    await expect(primarySlot(page)).toHaveText(mock.examiner.tap);
    await primarySlot(page).click();
    await expect(primarySlot(page)).toHaveText(mock.look.ready);
  });

  test("retries failed preload before Start and reports a native decoding failure during playback", async ({
    page,
  }) => {
    await seedDraw(page);
    let status = 503;
    await page.route("**/audio/**", (route) =>
      route.fulfill({ status, contentType: "audio/wav", body: "invalid audio" }),
    );
    await page.goto("/fa/mock/exam");
    await continueToDraw(page);
    await page.getByRole("button", { name: anyCardName }).first().click();
    await expect(page.getByText(mock.reveal.failed).filter({ visible: true })).toBeVisible();
    await expect(primarySlot(page)).toHaveAttribute("aria-disabled", "true");
    expect(await page.evaluate((key) => sessionStorage.getItem(key), markerKey)).toBeNull();
    status = 200;
    await page.getByRole("button", { name: messages.error.retry }).click();
    await expect(primarySlot(page)).toHaveAttribute("aria-disabled", "false");
    await primarySlot(page).click();
    await expect(page.getByRole("dialog", { name: mock.dialog.audioTitle })).toBeVisible();
  });
});

test.describe("native recording", () => {
  test("keeps, reloads and deletes a native recording locally, and releases the tracks", async ({
    page,
    browserName,
  }) => {
    test.slow();
    test.skip(!(await mediaClockRuns(page)), NO_AUDIO_OUTPUT);
    await seedDraw(page);
    await page.route("**/audio/**", (route) => route.fulfill({ contentType: "audio/wav", body: wave() }));
    await observeMicrophone(page, browserName === "webkit");
    const writes: string[] = [];
    page.on("request", (request) => {
      if (!["GET", "HEAD"].includes(request.method()) || request.postDataBuffer() !== null) {
        writes.push(`${request.method()} ${request.url()}`);
      }
    });
    page.on("websocket", (socket) => socket.on("framesent", () => writes.push(socket.url())));
    await page.goto("/fa/mock/practice");
    const supported = await page.evaluate(
      () =>
        typeof MediaRecorder !== "undefined" &&
        ["audio/mp4;codecs=mp4a.40.2", "audio/mp4", "audio/webm;codecs=opus", "audio/webm"].some((mime) =>
          MediaRecorder.isTypeSupported(mime),
        ) &&
        Reflect.has(navigator, "mediaDevices") &&
        typeof navigator.mediaDevices.getUserMedia === "function" &&
        typeof AudioContext.prototype.createMediaStreamDestination === "function",
    );
    test.skip(!supported, "Native audio recording is unavailable in this browser");
    await continueToDraw(page, true);
    await drawAndReveal(page);
    await startAndLook(page);
    await untilYourTurn(page);
    await expect(
      page.getByText(mock.interview.recording, { exact: true }).filter({ visible: true }),
    ).toBeVisible();
    // Wait for real MediaRecorder data before ending the attempt.
    const answerTime = page
      .getByText(mock.interview.answerTime, { exact: true })
      .filter({ visible: true })
      .locator("..")
      .locator("time");
    await expect
      .poll(async () => recordingTimes.has((await answerTime.textContent())?.trim() ?? ""))
      .toBe(true);
    await finishEarly(page);
    await assertTracksReleased(page);
    const sample = page.getByRole("button", { name: mock.review.sample }).first();
    const wide = await page.evaluate(() => matchMedia("(min-width: 48rem)").matches);
    await expect(sample).toHaveAttribute("aria-expanded", String(wide));
    const recorded = page.getByRole("button", {
      name: t("mock.review.playTake", { role: mock.examiner.first, part: 1 }),
      exact: true,
    });
    await expect(recorded).toBeVisible();
    await page.getByRole("switch", { name: mock.review.keep }).click();
    await expect(page.getByText(mock.review.kept).filter({ visible: true })).toBeVisible();
    await page.reload();
    await expect(recorded).toBeVisible();
    await recorded.click();
    await expect(recorded).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByText(mock.review.kept).filter({ visible: true })).toBeVisible();
    await page.getByRole("button", { name: mock.review.delete }).click();
    await expect(page.getByText(mock.review.deleted).filter({ visible: true })).toBeVisible();
    await expect(recorded).toHaveCount(0);
    await page.reload();
    await expect(page.getByText(mock.review.notKept).filter({ visible: true })).toBeVisible();
    await expect(sample).toHaveAttribute("aria-expanded", "true");
    expect(writes).toEqual([]);
  });
});
