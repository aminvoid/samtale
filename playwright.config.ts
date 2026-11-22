import { defineConfig, devices } from "@playwright/test";

const PORT = "3100";
// Fake microphone input, and a fake audio sink: without a usable output device (a locked or
// non-GUI session, many CI hosts) the media clock never advances and real clips never end.
const CHROMIUM_MEDIA_FLAGS = [
  "--use-fake-ui-for-media-stream",
  "--use-fake-device-for-media-stream",
  "--disable-audio-output",
];

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  ...(process.env.CI ? { workers: 2 } : {}),
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: "fa-IR",
    timezoneId: "Europe/Copenhagen",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "mobile-chromium",
      use: { ...devices["Pixel 7"], launchOptions: { args: CHROMIUM_MEDIA_FLAGS } },
    },
    { name: "mobile-webkit", use: { ...devices["iPhone 15"] } },
    {
      name: "desktop-chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 800 },
        launchOptions: { args: CHROMIUM_MEDIA_FLAGS },
      },
    },
  ],
  webServer: {
    // CI builds once in an earlier step; locally, build first.
    command: process.env.CI
      ? `npm run start -- --port ${PORT}`
      : `npm run build && npm run start -- --port ${PORT}`,
    url: `http://localhost:${PORT}/fa`,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
  },
});
