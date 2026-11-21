import AxeBuilder from "@axe-core/playwright";
import messages from "../messages/fa.json" with { type: "json" };
import { AXE_TAGS, expect, test } from "./fixtures";

const noMatchQuery = "zzq-no-matching-topic";

test("browses by theme and opens a topic study page", async ({ page }) => {
  await page.goto("/fa");
  await page.getByRole("link", { name: new RegExp(messages.home.topics), exact: false }).click();
  await expect(page).toHaveURL("/fa/topics");

  const theme = page.getByRole("link", { name: /^Arbejde og arbejdsmarked/ });
  await expect(theme).toBeVisible();
  await theme.click();
  await expect(page).toHaveURL("/fa/topics/themes/arbejde");

  const main = page.getByRole("main");
  const topic = main.locator('a[href="/fa/topics/2024-maj-b"]');
  const danishTitle = await topic.locator('[lang="da"]').first().innerText();
  const persianTitle = await topic.locator('[lang="fa"]').innerText();
  await topic.click();
  await expect(page).toHaveURL("/fa/topics/2024-maj-b");
  await expect(page).toHaveTitle(`${danishTitle} — ${persianTitle} · ${messages.metadata.appName}`);
  await expect(main.getByRole("heading", { level: 1 })).toContainText(danishTitle);
  await expect(main.getByRole("heading", { name: messages.study.generalHeading })).toBeVisible();
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
  await expect(page.locator(href.slice(href.indexOf("#")))).toBeFocused();
});

test("searches live in Persian and Danish and returns to themes", async ({ page }) => {
  // Deterministic: Enter commits the search at once (no debounce timing), then we wait for
  // results that only that query produces. Pausing the browser clock also stalls Next's own
  // rendering, so the debounce itself is covered by the component tests instead.
  await page.goto("/fa/topics");
  const field = page.getByRole("textbox", { name: messages.library.search.label });
  await expect(field).toHaveAttribute("dir", "auto");
  // The controlled field replaces the static form after hydration; typing earlier gets reset.
  await expect(field).toHaveAttribute("value", "");
  const main = page.getByRole("main");
  const count = main.getByRole("heading", { level: 2 });
  const status = main.getByRole("status");

  for (const { query, exactCount, topicId } of [
    { query: "كار", exactCount: "۳۶ موضوع پیدا شد", topicId: "2024-maj-c" },
    { query: "SUNDHED", exactCount: "۶ موضوع پیدا شد", topicId: "2020-nov-c" },
  ]) {
    await field.fill(query);
    await expect(field).toHaveAttribute("value", query);
    await field.press("Enter");
    await expect(page).toHaveURL(
      (url) => url.pathname === "/fa/topics/search" && url.searchParams.get("q") === query,
    );
    await expect(count).toHaveText(exactCount);
    await expect(main.locator(`a[href="/fa/topics/${topicId}"]`)).toBeVisible();
    await expect(status).toHaveText(exactCount);
  }
  await expect(field).toBeFocused();

  await field.fill(noMatchQuery);
  await expect(field).toHaveAttribute("value", noMatchQuery);
  await field.press("Enter");
  await expect(page).toHaveURL((url) => url.searchParams.get("q") === noMatchQuery);
  await expect(count).toHaveText("موضوعی پیدا نشد");
  await expect(main.getByText(noMatchQuery, { exact: true })).toBeVisible();
  await expect(status).toHaveText("موضوعی پیدا نشد");
  await page.getByRole("link", { name: messages.library.search.browseInstead }).click();
  await expect(page).toHaveURL("/fa/topics");
});

test("restores the search query and results after returning from a topic", async ({ page }) => {
  const searchUrl = "/fa/topics/search?q=SUNDHED";
  const topicUrl = "/fa/topics/2020-nov-c";
  await page.goto(searchUrl);
  const field = page.getByRole("textbox", { name: messages.library.search.label });
  const main = page.getByRole("main");
  const match = main.locator(`a[href="${topicUrl}"]`);
  const count = main.getByRole("heading", { level: 2, name: "۶ موضوع پیدا شد" });
  await expect(count).toBeVisible();
  await match.click();
  await expect(page).toHaveURL(topicUrl);
  await page.goBack();
  await expect(page).toHaveURL(searchUrl);
  await expect(field).toHaveValue("SUNDHED");
  await expect(count).toBeVisible();
  await expect(match).toBeVisible();
  await page.goForward();
  await expect(page).toHaveURL(topicUrl);
});

test("keeps empty search silent and clears a no-results query", async ({ page }) => {
  await page.goto("/fa/topics/search");
  const main = page.getByRole("main");
  const field = main.getByRole("textbox", { name: messages.library.search.label });
  const status = main.getByRole("status");
  const count = main.getByRole("heading", { level: 2 });
  await expect(field).toHaveValue("");
  await expect(status).toBeEmpty();
  await expect(count).toHaveCount(0);

  await page.goto(`/fa/topics/search?q=${noMatchQuery}`);
  await expect(count).toHaveText("موضوعی پیدا نشد");
  await main.getByRole("button", { name: messages.library.search.clear }).click();
  await expect(page).toHaveURL("/fa/topics/search");
  await expect(field).toHaveValue("");
  await expect(field).toBeFocused();
  await expect(status).toBeEmpty();
  await expect(count).toHaveCount(0);
});

for (const path of ["themes/unknown-theme", "terms/2015-nov", "2015-nov-a"]) {
  test(`unknown library ID ${path} returns a 404 with a link to the library`, async ({ page }) => {
    const response = await page.goto(`/fa/topics/${path}`);
    expect(response?.status()).toBe(404);
    const main = page.getByRole("main");
    await expect(main.getByRole("heading", { level: 1, name: messages.notFound.title })).toBeVisible();
    await expect(main.getByRole("link", { name: messages.library.search.browseInstead })).toHaveAttribute(
      "href",
      "/fa/topics",
    );
  });
}

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

  for (const width of [768, 1280]) {
    await page.setViewportSize({ width, height: 800 });
    await expect(top).toBeVisible();
    await expect(top.getByRole("link")).toHaveCount(6);
    await expect(top.getByRole("link").last()).toHaveAccessibleName(messages.nav.progress);
    await expect(top.getByRole("link").last()).toHaveAttribute("href", "/fa/progress");
    await expect(top.getByRole("link", { name: messages.nav.topics })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(bottom).toBeHidden();
  }
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

test("drawer contains Tab focus and passes axe while open", async ({ page, browserName }) => {
  await page.goto("/fa/topics");
  await page.getByRole("button", { name: messages.nav.menu }).click();
  const drawer = page.getByRole("dialog");
  const close = drawer.getByRole("button", { name: messages.nav.close });
  const lastLink = drawer.getByRole("link", { name: messages.nav.privacy });
  const modifier = browserName === "webkit" ? "Alt+" : "";

  await lastLink.focus();
  await page.keyboard.press(`${modifier}Tab`);
  await expect(close).toBeFocused();
  await page.keyboard.press(`${modifier}Shift+Tab`);
  await expect(lastLink).toBeFocused();

  await page.waitForFunction(() =>
    document.getAnimations().every((animation) => animation.playState !== "running"),
  );
  // Base UI's focus-trap guards are 1×1 px clipped spans; Safari gives them role="button" with no
  // name. They are library internals for focus containment (asserted above), not app controls.
  const results = await new AxeBuilder({ page })
    .withTags(AXE_TAGS)
    .exclude("[data-base-ui-focus-guard]")
    .analyze();
  expect(results.violations).toEqual([]);
});

for (const route of [
  "/fa/topics",
  "/fa/topics/terms",
  "/fa/topics/similar",
  "/fa/topics/themes/arbejde",
  "/fa/topics/terms/2024-maj",
  "/fa/topics/2024-maj-b",
  "/fa/topics/search",
  "/fa/topics/search?q=sundhed",
  `/fa/topics/search?q=${noMatchQuery}`,
]) {
  test(`${route} passes axe`, async ({ page }) => {
    await page.goto(route);
    const main = page.getByRole("main");
    await expect(main.getByRole("heading", { level: 1 })).toBeVisible();
    if (route.endsWith("/search")) await expect(main.getByRole("status")).toBeEmpty();
    if (route.includes("?")) {
      await expect(main.getByRole("status")).toHaveText(
        route.endsWith(noMatchQuery) ? "موضوعی پیدا نشد" : "۶ موضوع پیدا شد",
      );
    }
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
