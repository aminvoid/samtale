import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import messages from "../../../messages/fa.json";
import { renderWithIntl } from "@/test/render-with-intl";
import { currentTopic, olderTopic, theme } from "./library-fixtures.test-data";
import { NextIntlClientProvider } from "next-intl";
import { buildFormats } from "@/i18n/formats";
import { ThemeResults } from "./theme-results";

vi.mock("@/i18n/navigation", async () => {
  const { MockLocaleLink } = await import("./library-fixtures.test-data");
  return { Link: MockLocaleLink };
});

afterEach(cleanup);

describe("subtheme filters", () => {
  const topics = [currentTopic, olderTopic];

  it("shows all topics for an unknown filter and gives each chip a shareable URL", () => {
    renderWithIntl(<ThemeResults theme={theme} topics={topics} selectedSubtheme="unknown" />);

    expect(screen.getByRole("link", { name: messages.library.filter.all })).toHaveAttribute(
      "aria-current",
      "true",
    );
    expect(screen.getByRole("link", { name: "شغل" })).toHaveAttribute(
      "href",
      "/fa/topics/themes/arbejde?sub=jobs",
    );
    expect(screen.getByRole("link", { name: /^Arbejde/ })).toBeVisible();
    expect(screen.getByRole("link", { name: /^Pension/ })).toBeVisible();
  });

  it("shows only the selected subtheme and handles a filter with no published topics", () => {
    const result = renderWithIntl(<ThemeResults theme={theme} topics={topics} selectedSubtheme="pension" />);
    expect(screen.getByRole("link", { name: "بازنشستگی" })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("link", { name: /^Pension/ })).toBeVisible();
    expect(screen.queryByRole("link", { name: /^Arbejde/ })).not.toBeInTheDocument();
    result.rerender(
      <NextIntlClientProvider
        locale="fa"
        messages={messages}
        formats={buildFormats("fa")}
        timeZone="Europe/Copenhagen"
      >
        <ThemeResults theme={theme} topics={topics} selectedSubtheme="work-time" />
      </NextIntlClientProvider>,
    );
    expect(screen.getByText(messages.library.filter.empty)).toBeVisible();
  });
});
