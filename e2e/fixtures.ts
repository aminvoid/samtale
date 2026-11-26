import { test as base, expect, type Locator, type Page } from "@playwright/test";

/**
 * Shared fixtures. Every test that uses `page` fails on any Content Security Policy violation
 * (ADR-0011): `securitypolicyviolation` events in every document, and CSP errors on the console.
 */
const CSP_LISTENER = `document.addEventListener("securitypolicyviolation", (event) => {
  window.__pd3ReportCsp(event.violatedDirective + " blocked " + event.blockedURI);
});`;

export const test = base.extend<{ cspViolations: string[] }>({
  cspViolations: [
    async ({ page }, provide) => {
      const violations: string[] = [];
      await page.exposeFunction("__pd3ReportCsp", (violation: string) => {
        violations.push(violation);
      });
      await page.addInitScript({ content: CSP_LISTENER });
      page.on("console", (message) => {
        if (message.type() === "error" && /Content Security Policy/i.test(message.text())) {
          violations.push(message.text());
        }
      });
      await provide(violations);
      expect(violations, "Content Security Policy violations").toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

export const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

/**
 * Waits until React has hydrated the element (it attaches its props to the DOM node). Before that,
 * a link is a plain anchor: Enter or a click makes a full page load instead of a client-side
 * navigation, which a slow, loaded WebKit run can hit.
 */
export async function waitForHydration(locator: Locator) {
  await expect
    .poll(() => locator.evaluate((el) => Object.keys(el).some((key) => key.startsWith("__reactProps$"))))
    .toBe(true);
}

/**
 * Simulates a denied microphone: getUserMedia rejects with NotAllowedError. Headless WebKit on
 * Linux has no navigator.mediaDevices at all, so the stub creates it; otherwise the app would
 * (correctly) report the microphone as unavailable rather than denied.
 */
export async function denyMicrophone(page: Page) {
  await page.addInitScript(() => {
    const getUserMedia = () => Promise.reject(new DOMException("Permission denied", "NotAllowedError"));
    if (!("mediaDevices" in navigator)) {
      Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia } });
      return;
    }
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
      configurable: true,
      value: getUserMedia,
    });
  });
}
