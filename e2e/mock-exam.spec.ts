import AxeBuilder from "@axe-core/playwright";
import type { Page, TestInfo } from "@playwright/test";
import messages from "../messages/fa.json" with { type: "json" };
import { AXE_TAGS, expect, test } from "./fixtures";

/**
 * Mock exam journeys (US-026 to US-045). Examiner clips are stubbed: every `play()` reports
 * "playing" and then "ended" shortly after, so the runner moves through the script in real time
 * (examiner gaps are 600 ms and practice can skip the 10 s look), without `page.clock`.
 *
 * Recording uses Chromium's fake media device (the projects' launch flags). WebKit has no fake
 * device, so on WebKit the full practice journey continues without recording instead.
 */

const { mock } = messages;
const SHOTS = "test-results/mock";
// Text queries use `filter({ visible: true })`: with Cache Components the previous route stays
// mounted but hidden (React Activity), and getByText, unlike getByRole, also matches hidden nodes.

async function stubExaminer(page: Page) {
  // Preload fetches every clip; a few bytes are enough because playback itself is stubbed.
  await page.route("**/audio/**", (route) =>
    route.fulfill({ status: 200, contentType: "audio/mpeg", body: Buffer.from([0xff, 0xfb, 0x90, 0x00]) }),
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

async function denyMicrophone(page: Page) {
  await page.addInitScript(() => {
    if (!("mediaDevices" in navigator)) return;
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
      configurable: true,
      value: () => Promise.reject(new DOMException("Permission denied", "NotAllowedError")),
    });
  });
}

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
  const cards = page.getByRole("button", { name: /^کارت . از ۳$/ });
  await expect(cards).toHaveCount(3);
  await cards.first().click();
  await expect(primarySlot(page)).toHaveText(mock.reveal.start);
  await expect(primarySlot(page)).toHaveAttribute("aria-disabled", "false");
  // The drawn-card thumbnails are native disabled, so they leave the tab order (a11y m8).
  const thumbnails = page.getByRole("button", { name: /^کارت . از ۳$/ });
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

test.describe("mock exam", () => {
  test.beforeEach(async ({ page }) => {
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
    await expect(page.getByText(/^زمان کل:/).filter({ visible: true })).toBeVisible();
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
        page
          .getByText(/^طول ضبط:/)
          .filter({ visible: true })
          .first(),
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
