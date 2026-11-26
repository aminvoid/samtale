import type { Page, Request } from "@playwright/test";
import { expect, test } from "./fixtures";

const KB = 1024;

/** Bytes transferred for one resource type while loading `path` (ADR-0014). */
async function transferred(
  page: Page,
  path: string,
  resourceType: string,
  cutoff: "load" | "networkidle",
): Promise<number> {
  const sizes: Array<Promise<number>> = [];
  const recordSize = (request: Request) => {
    if (request.resourceType() === resourceType) sizes.push(request.sizes().then((s) => s.responseBodySize));
  };
  const stop = () => page.off("requestfinished", recordSize);
  page.on("requestfinished", recordSize);
  if (cutoff === "load") page.once("load", stop);
  try {
    await page.goto(path, { waitUntil: cutoff });
  } finally {
    page.off("load", stop);
    stop();
  }
  return (await Promise.all(sizes)).reduce((sum, n) => sum + n, 0);
}

test.beforeEach(({ browserName }) => {
  test.skip(browserName !== "chromium", "Budgets are measured on Chromium");
});

test("@budget home: JavaScript ≤ 170 KB transferred", async ({ page }) => {
  expect(await transferred(page, "/fa", "script", "load")).toBeLessThanOrEqual(170 * KB);
});

test("@budget home: fonts ≤ 150 KB transferred", async ({ page }) => {
  expect(await transferred(page, "/fa", "font", "networkidle")).toBeLessThanOrEqual(150 * KB);
});
