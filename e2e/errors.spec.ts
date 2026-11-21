import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { createTranslator } from "next-intl";
import messages from "../messages/fa.json" with { type: "json" };
import { AXE_TAGS, expect, test } from "./fixtures";

const metadata = createTranslator({ locale: "fa", messages, namespace: "metadata" });

async function expectPersianNotFound(page: Page) {
  await expect(page.locator("html")).toHaveAttribute("lang", "fa");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  const heading = page.getByRole("heading", { level: 1, name: messages.notFound.title });
  await expect(heading).toBeFocused();
  await expect(page.getByRole("link", { name: messages.notFound.backHome })).toHaveAttribute(
    "href",
    /^\/fa\/?$/,
  );
  await expect(page).toHaveTitle(
    metadata("titleTemplate", { page: messages.notFound.title, appName: metadata("appName") }),
  );
}

test.describe("not found (fa)", () => {
  for (const path of ["/fa/does-not-exist", "/fa/a/b/c", "/fa/foo.bar", "/audio/missing.mp3"]) {
    test(`${path} returns the Persian 404`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(404);
      await expectPersianNotFound(page);
    });
  }

  test("unprefixed paths, including dotted content IDs, redirect to /fa", async ({ page }) => {
    const response = await page.goto("/topics/2016-nov-c.sitA.q1");
    await expect(page).toHaveURL(/\/fa\/topics\/2016-nov-c\.sitA\.q1$/);
    expect(response?.status()).toBe(404);
    await expectPersianNotFound(page);
  });

  test("public files are still served", async ({ request }) => {
    expect((await request.get("/robots.txt")).status()).toBe(200);
    expect((await request.get("/favicon.ico")).status()).toBe(200);
  });

  test("has no axe violations (WCAG 2.2 A/AA)", async ({ page }) => {
    await page.goto("/fa/does-not-exist");
    const home = page.getByRole("link", { name: messages.notFound.backHome });
    expect(await home.evaluate((link) => link.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
    const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe("error boundary (fa)", () => {
  // /fa/test-error throws after hydration; it exists only in the preview channel.
  test("a render error announces its title and offers retry and a way home", async ({ page }) => {
    await page.goto("/fa/test-error");
    const heading = page.getByRole("heading", { level: 1, name: messages.error.title });
    await expect(heading).toBeVisible();
    await expect(heading).toBeFocused();
    await expect(page).toHaveTitle(messages.error.title);
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByRole("button", { name: messages.error.retry })).toBeVisible();

    const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
    expect(results.violations).toEqual([]);

    await page.getByRole("link", { name: messages.error.backHome }).click();
    await expect(page).toHaveURL(/\/fa\/?$/);
    await expect(page).toHaveTitle(metadata("appName"));
  });
});
