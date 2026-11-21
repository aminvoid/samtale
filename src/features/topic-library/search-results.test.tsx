import { act, cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import messages from "../../../messages/fa.json";
import { renderWithIntl } from "@/test/render-with-intl";
import { currentTopic, olderTopic, searchIndex } from "./library-fixtures.test-data";
import { SearchResults } from "./search-results";

vi.mock("@/i18n/navigation", async () => {
  const { MockLocaleLink } = await import("./library-fixtures.test-data");
  return { Link: MockLocaleLink };
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("library search", () => {
  it.each(["SUNDHED", "كار", "نِيمه‌وقت", "نیمه وقت", "نیمهوقت", "sundhed كار"])(
    "finds the published topic and formats the count in Persian for %s",
    (query) => {
      renderWithIntl(<SearchResults query={query} topics={[currentTopic, olderTopic]} index={searchIndex} />);
      expect(screen.getByRole("heading")).toHaveTextContent("۱ موضوع پیدا شد");
      expect(screen.getByRole("link", { name: /^Arbejde/ })).toBeVisible();
      expect(screen.queryByRole("link", { name: /^Pension/ })).not.toBeInTheDocument();
    },
  );

  it("links a Danish question match to its exact section", () => {
    renderWithIntl(<SearchResults query="sundhed" topics={[currentTopic]} index={searchIndex} />);
    expect(screen.getByRole("link", { name: "پیدا شد در سؤال موقعیت B" })).toHaveAttribute(
      "href",
      "/fa/topics/2024-maj-b#sitB",
    );
  });

  it("isolates the submitted query and offers a way back to the themes when nothing matches", () => {
    renderWithIntl(
      <SearchResults query="sundhed pension" topics={[currentTopic, olderTopic]} index={searchIndex} />,
    );
    expect(screen.getByRole("heading")).toHaveTextContent("موضوعی پیدا نشد");
    expect(screen.getByText("sundhed pension").tagName).toBe("BDI");
    expect(screen.getByRole("link", { name: messages.library.search.browseInstead })).toHaveAttribute(
      "href",
      "/fa/topics",
    );
  });

  it("leaves the live region silent until a query is entered", () => {
    renderWithIntl(<SearchResults query="" topics={[currentTopic]} index={searchIndex} />);
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });

  it("mounts an empty live region before announcing the first committed results", () => {
    vi.useFakeTimers();
    renderWithIntl(<SearchResults query="sundhed" topics={[currentTopic]} index={searchIndex} />);
    const status = screen.getByRole("status");

    expect(screen.getByRole("heading")).toHaveTextContent("۱ موضوع پیدا شد");
    expect(status).toBeEmptyDOMElement();
    act(() => {
      vi.advanceTimersToNextFrame();
    });
    expect(status).toBeEmptyDOMElement();
    act(() => {
      vi.advanceTimersToNextFrame();
    });
    expect(screen.getByRole("status")).toBe(status);
    expect(status).toHaveTextContent("۱ موضوع پیدا شد");
  });
});
