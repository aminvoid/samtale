import AxeBuilder from "@axe-core/playwright";
import messages from "../messages/fa.json" with { type: "json" };
import { AXE_TAGS, expect, test } from "./fixtures";

test("browses by theme and opens a topic placeholder", async ({ page }) => {
  await page.goto("/fa");
  await page.getByRole("link", { name: new RegExp(messages.home.topics), exact: false }).click();
  await expect(page).toHaveURL("/fa/topics");

  const theme = page.getByRole("link", { name: /^Arbejde og arbejdsmarked/ });
  await expect(theme).toBeVisible();
  await theme.click();
  await expect(page).toHaveURL("/fa/topics/themes/arbejde");

  const main = page.getByRole("main");
  const topic = main.locator('a[href="/fa/topics/2024-maj-b"]');
  const title = await topic.locator('[lang="da"]').first().innerText();
  await topic.click();
  await expect(page).toHaveURL("/fa/topics/2024-maj-b");
  await expect(main.getByRole("heading", { level: 1 })).toContainText(title);
  await expect(main.getByText(messages.common.comingSoon)).toBeVisible();
  await expect(main.getByRole("heading", { level: 1 })).toBeFocused();
});

test("filters a theme and restores the selection from browser history", async ({ page }) => {
  await page.goto("/fa/topics/themes/arbejde");
  const filters = page.getByRole("navigation", { name: messages.library.filter.label });
  const all = filters.getByRole("link", { name: messages.library.filter.all, exact: true });
  const firstSubtheme = filters.getByRole("link").nth(1);
  await expect(all).toHaveAttribute("aria-current", "true");
  await firstSubtheme.click();
  await expect(page).toHaveURL(/\?sub=.+$/);
  await expect(firstSubtheme).toHaveAttribute("aria-current", "true");
  await page.reload();
  await expect(firstSubtheme).toHaveAttribute("aria-current", "true");
  await page.goBack();
  await expect(all).toHaveAttribute("aria-current", "true");
});

test("opens exam terms and a similar question occurrence", async ({ page }) => {
  await page.goto("/fa/topics");
  const views = page.getByRole("navigation", { name: messages.library.views });
  const terms = views.getByRole("link", { name: messages.library.view.terms });
  await terms.focus();
  await page.keyboard.press("Enter");
  await expect(terms).toHaveAttribute("aria-current", "page");
  await expect(terms).toBeFocused();
  await page.getByRole("heading", { level: 2, name: "Maj–Juni 2024" }).getByRole("link").click();
  await expect(page).toHaveURL("/fa/topics/terms/2024-maj");
  await expect(page.getByRole("heading", { level: 1, name: "Maj–Juni 2024" })).toBeVisible();

  await page.goto("/fa/topics/similar");
  const occurrence = page.getByRole("main").locator('a[href*="#sit"], a[href$="#general"]').first();
  await expect(occurrence).toBeVisible();
  await expect(occurrence).toContainText(/(?:Maj–Juni|Nov–Dec) \d{4} · [ABC]/);
  const href = await occurrence.getAttribute("href");
  if (href === null) throw new Error("The occurrence must link to a topic section.");
  await occurrence.click();
  await expect(page).toHaveURL(href);
  await expect(page.getByText(messages.common.comingSoon)).toBeVisible();
});

test("searches live in Persian and Danish and returns to themes", async ({ page }) => {
  await page.goto("/fa/topics");
  const field = page.getByRole("textbox", { name: messages.library.search.label });
  await expect(field).toHaveAttribute("dir", "auto");
  await field.fill("كار");
  await expect(page).toHaveURL(
    (url) => url.pathname === "/fa/topics/search" && url.searchParams.get("q") === "كار",
  );
  const resultCount = page.getByRole("status");
  await expect(resultCount).toContainText(/[۰-۹]+ موضوع پیدا شد/);
  await expect(field).toBeFocused();

  await field.fill("SUNDHED");
  await expect(page).toHaveURL((url) => url.searchParams.get("q") === "SUNDHED");
  await expect(
    page
      .getByRole("main")
      .locator('a[href^="/fa/topics/"]')
      .filter({ has: page.locator('[lang="da"]') })
      .first(),
  ).toBeVisible();
  await expect(resultCount).toContainText(/[۰-۹]+ موضوع پیدا شد/);

  await field.fill("zzq-no-matching-topic");
  await expect(resultCount).toHaveText("موضوعی پیدا نشد");
  await expect(page.getByText("zzq-no-matching-topic", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: messages.library.search.browseInstead }).click();
  await expect(page).toHaveURL("/fa/topics");
});

test("uses bottom tabs at 375 px and a top navigation at 1280 px", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/fa/topics");
  const bottom = page.locator('[data-sticky="tab-bar"]');
  const top = page.getByRole("banner").locator("nav");
  await expect(bottom).toBeVisible();
  await expect(bottom).toHaveCSS("position", "fixed");
  await expect(bottom.getByRole("link")).toHaveCount(5);
  await expect(bottom.getByRole("link", { name: messages.nav.topics })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(top).toBeHidden();

  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(top).toBeVisible();
  await expect(top.getByRole("link")).toHaveCount(5);
  await expect(top.getByRole("link", { name: messages.nav.topics })).toHaveAttribute("aria-current", "page");
  await expect(bottom).toBeHidden();
});

test("drawer supports Escape, focus restoration and utility links", async ({ page }) => {
  await page.goto("/fa");
  const openMenu = page.getByRole("button", { name: messages.nav.menu });
  await openMenu.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(page.locator("header button[aria-expanded]")).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(openMenu).toBeFocused();

  await openMenu.click();
  await dialog.getByRole("link", { name: messages.nav.progress }).click();
  await expect(page).toHaveURL("/fa/progress");
  await expect(dialog).toBeHidden();
  await expect(page.getByText(messages.common.comingSoon)).toBeVisible();
});

for (const route of ["/fa/topics", "/fa/topics/terms", "/fa/topics/similar", "/fa/topics/search?q=sundhed"]) {
  test(`${route} passes axe`, async ({ page }) => {
    await page.goto(route);
    await expect(page.getByRole("main").getByRole("heading", { level: 1 })).toBeVisible();
    if (route.includes("?")) await expect(page.getByRole("status")).toContainText("موضوع پیدا شد");
    const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
    expect(results.violations).toEqual([]);
  });
}

test("fits a narrow viewport at double text size", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/fa/topics");
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
  });
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
    )
    .toBeLessThanOrEqual(0);
});

test.describe("dark colour scheme", () => {
  test.use({ colorScheme: "dark" });

  test("library passes axe", async ({ page }) => {
    await page.goto("/fa/topics");
    const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
    expect(results.violations).toEqual([]);
  });
});
