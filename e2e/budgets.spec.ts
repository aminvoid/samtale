import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

const KB = 1024;

/** Bytes transferred for one resource type while loading `path` (ADR-0014). */
async function transferred(page: Page, path: string, resourceType: string): Promise<number> {
  const sizes: Array<Promise<number>> = [];
  page.on("requestfinished", (request) => {
    if (request.resourceType() === resourceType) sizes.push(request.sizes().then((s) => s.responseBodySize));
  });
  await page.goto(path, { waitUntil: "networkidle" });
  return (await Promise.all(sizes)).reduce((sum, n) => sum + n, 0);
}

test.beforeEach(({ browserName }) => {
  test.skip(browserName !== "chromium", "Budgets are measured on Chromium");
});

test("@budget home: JavaScript ≤ 170 KB transferred", async ({ page }) => {
  expect(await transferred(page, "/fa", "script")).toBeLessThanOrEqual(170 * KB);
});

test("@budget home: fonts ≤ 150 KB transferred", async ({ page }) => {
  expect(await transferred(page, "/fa", "font")).toBeLessThanOrEqual(150 * KB);
});
