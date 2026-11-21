import AxeBuilder from "@axe-core/playwright";
import messages from "../messages/fa.json" with { type: "json" };
import { AXE_TAGS, expect, test } from "./fixtures";

test.describe("home (fa)", () => {
  test("/ redirects to /fa and renders RTL Persian with isolated Danish", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/fa\/?$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "fa");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    const danish = page.locator('[lang="da"]');
    await expect(danish.first()).toBeVisible();
    for (const el of await danish.all()) await expect(el).toHaveAttribute("dir", "ltr");

    // Danish inside the Persian tip is isolated as its own LTR run (ADR-0004 §3).
    await expect(page.locator('bdi[lang="da"]').filter({ hasText: "Hvorfor tror du, …?" })).toBeVisible();

    const headingFont = await page
      .getByRole("heading", { level: 1 })
      .evaluate((el) => getComputedStyle(el).fontFamily);
    expect(headingFont).toContain("Vazirmatn");
    const danishFont = await page.locator('p[lang="da"]').evaluate((el) => getComputedStyle(el).fontFamily);
    expect(danishFont).toContain("Atkinson Hyperlegible Next");
  });

  test("has no axe violations (WCAG 2.2 A/AA)", async ({ page }) => {
    await page.goto("/fa");
    const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
    expect(results.violations).toEqual([]);
  });

  test.describe("dark colour scheme", () => {
    test.use({ colorScheme: "dark" });

    test("has no axe violations (WCAG 2.2 A/AA)", async ({ page }) => {
      await page.goto("/fa");
      expect(await page.evaluate(() => matchMedia("(prefers-color-scheme: dark)").matches)).toBe(true);
      const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
      expect(results.violations).toEqual([]);
    });
  });

  test.describe("forced colours", () => {
    test.use({ forcedColors: "active" });

    test("outlines current, selected and pressed controls", async ({ page }) => {
      await page.goto("/fa");
      expect(await page.evaluate(() => matchMedia("(forced-colors: active)").matches)).toBe(true);

      // Exercise the global rules without introducing a route just for primitive previews.
      const outlines = await page.evaluate(() => {
        const states = [
          { role: "link", attribute: "aria-current", value: "page" },
          { role: "tab", attribute: "aria-selected", value: "true" },
          { role: "radio", attribute: "aria-checked", value: "true" },
          { role: "button", attribute: "aria-pressed", value: "true" },
        ];
        return states.map(({ role, attribute, value }) => {
          const element = document.createElement("div");
          element.setAttribute("role", role);
          element.setAttribute(attribute, value);
          document.body.append(element);
          const { outlineStyle, outlineWidth } = getComputedStyle(element);
          element.remove();
          return { role, outlineStyle, outlineWidth };
        });
      });
      expect(outlines).toEqual(
        ["link", "tab", "radio", "button"].map((role) => ({
          role,
          outlineStyle: "solid",
          outlineWidth: "2px",
        })),
      );
    });
  });

  test("the first Tab reveals the skip link and Enter focuses main", async ({ page, browserName }) => {
    await page.goto("/fa");
    const skipLink = page.getByRole("link", { name: messages.common.skipToContent });
    await expect(skipLink).toHaveCSS("clip-path", "inset(50%)");

    // Safari/WebKit only moves focus to links with Option+Tab (the default "Press Tab to highlight
    // each item" setting is off), so keyboard users there use Alt+Tab.
    await page.keyboard.press(browserName === "webkit" ? "Alt+Tab" : "Tab");
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toBeVisible();
    await expect(skipLink).toHaveCSS("clip-path", "none");
    await expect(skipLink).toHaveCSS("outline-style", "solid");

    await page.keyboard.press("Enter");
    await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe("main");
  });

  test("sends the security headers", async ({ request }) => {
    const headers = (await request.get("/fa")).headers();
    expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(headers["permissions-policy"]).toContain("microphone=(self)");
    expect(headers["x-robots-tag"]).toContain("noindex");
    expect(headers["x-powered-by"]).toBeUndefined();
  });

  test("no horizontal scroll at 320 px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto("/fa");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
