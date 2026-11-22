import AxeBuilder from "@axe-core/playwright";
import messages from "../messages/fa.json" with { type: "json" };
import { AXE_TAGS, expect, test } from "./fixtures";

const { guide } = messages;
const overviewPath = "/fa/guide";
const partTwoPath = "/fa/guide/delproeve-2";

for (const width of [375, 1280]) {
  test(`renders both guide pages in RTL at ${String(width)} px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 812 });
    await page.goto(overviewPath);

    const html = page.locator("html");
    await expect(html).toHaveAttribute("lang", "fa");
    await expect(html).toHaveAttribute("dir", "rtl");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(guide.overview.title);
    expect(await html.evaluate((element) => element.scrollWidth)).toBeLessThanOrEqual(width);

    await page.getByRole("link", { name: guide.overview.partTwoLink }).click();
    await expect(page).toHaveURL(partTwoPath);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(guide.title);
    await expect(page.getByRole("main").locator('[lang="da"]:not([dir="ltr"])')).toHaveCount(0);
    expect(await html.evaluate((element) => element.scrollWidth)).toBeLessThanOrEqual(width);

    if (width === 375) {
      const contents = page.getByRole("button", { name: guide.onThisPage });
      await expect(contents).toHaveAttribute("aria-expanded", "false");
      await contents.click();
    }
    const contents = page.getByRole("navigation", { name: guide.onThisPage });
    await contents.getByRole("link", { name: guide.section.timeline }).click();
    await expect(page).toHaveURL(`${partTwoPath}#timeline`);
    const timeline = page.getByRole("region", { name: guide.section.timeline });
    await expect(timeline.getByRole("heading")).toBeFocused();
    await expect(timeline.getByRole("heading")).toBeInViewport();
    const segments = timeline.getByRole("listitem");
    await expect(segments).toHaveCount(4);
    const positions = await segments.evaluateAll((items) =>
      items.map((item) => ({ x: item.getBoundingClientRect().x, y: item.getBoundingClientRect().y })),
    );
    const [draw, look] = positions;
    if (draw === undefined || look === undefined) throw new Error("Expected the draw and look segments.");
    if (width === 375) expect(draw.y).toBeLessThan(look.y);
    else expect(draw.x).toBeGreaterThan(look.x);
  });
}

test("loads a plain-zero digit face for the Danish examiner transcript", async ({ page }) => {
  await page.goto(partTwoPath);
  const transcript = page.getByRole("region", { name: guide.section.steps }).locator('p[lang="da"]').filter({
    hasText: "10 sekunder",
  });
  const fonts = await transcript.evaluate(async (element) => {
    const style = getComputedStyle(element);
    const digitFamily = style.getPropertyValue("--font-danish-digits").trim();
    const face = `${style.fontWeight} ${style.fontSize} ${digitFamily}`;
    return {
      firstFamily: style.fontFamily.split(",")[0]?.trim().replaceAll('"', ""),
      digitFamily: digitFamily.replaceAll('"', ""),
      digitRanges: (await document.fonts.load(face, "10")).map((font) => font.unicodeRange),
      danishLetterFaces: (await document.fonts.load(face, "Ø")).length,
    };
  });
  expect(fonts.digitFamily).toBeTruthy();
  expect(fonts.firstFamily).toBe(fonts.digitFamily);
  expect(fonts.digitRanges).toEqual([expect.stringMatching(/^U\+0*30-0*39$/i)]);
  expect(fonts.danishLetterFaces).toBe(0);
});

test("plays the three examiner clips on demand, one at a time", async ({ page }) => {
  await page.addInitScript(() => {
    const sources = new WeakMap<HTMLMediaElement, string>();
    const paused = new WeakMap<HTMLMediaElement, boolean>();
    Object.defineProperties(HTMLMediaElement.prototype, {
      src: {
        get(this: HTMLMediaElement) {
          return sources.get(this) ?? "";
        },
        set(this: HTMLMediaElement, value: string) {
          sources.set(this, value);
        },
      },
      paused: {
        get(this: HTMLMediaElement) {
          return paused.get(this) ?? true;
        },
      },
      play: {
        value(this: HTMLMediaElement) {
          document.documentElement.dataset.guidePlayed = this.src;
          paused.set(this, false);
          this.dispatchEvent(new Event("playing"));
          return Promise.resolve();
        },
      },
      pause: {
        value(this: HTMLMediaElement) {
          paused.set(this, true);
        },
      },
    });
  });
  await page.goto(partTwoPath);
  const html = page.locator("html");
  const steps = page.getByRole("region", { name: guide.section.steps });
  const play = steps.getByRole("button");
  await expect(play).toHaveCount(3);
  await expect(html).not.toHaveAttribute("data-guide-played");

  const sources = new Set<string>();
  for (const button of await play.all()) {
    await button.click();
    await expect(button).toHaveAttribute("aria-pressed", "true");
    await expect(steps.getByRole("button", { pressed: true })).toHaveCount(1);
    await expect(html).toHaveAttribute("data-guide-played", /^\/audio\/.+\.mp3$/);
    const source = await html.getAttribute("data-guide-played");
    if (source !== null) sources.add(source);
  }
  expect(sources.size).toBe(3);
  await play.last().click();
  await expect(play.last()).toHaveAttribute("aria-pressed", "false");
});

for (const colorScheme of ["light", "dark"] satisfies ("light" | "dark")[]) {
  test(`passes axe on both guide pages in ${colorScheme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });

    await page.goto(overviewPath);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(guide.overview.title);
    expect((await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze()).violations).toEqual([]);

    await page.goto(partTwoPath);
    const contents = page.getByRole("button", { name: guide.onThisPage });
    if (await contents.isVisible()) {
      await contents.click();
      await expect(page.getByRole("navigation", { name: guide.onThisPage })).toBeVisible();
    }
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(guide.title);
    expect((await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze()).violations).toEqual([]);
  });
}
