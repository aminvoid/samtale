import { act, cleanup, fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../messages/fa.json";
import { renderWithIntl } from "@/test/render-with-intl";
import { LibrarySearchBox } from "./library-search-box";

const { push, searchParams } = vi.hoisted(() => ({
  push: vi.fn(),
  searchParams: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParams,
}));

vi.mock("@/i18n/navigation", () => ({
  getPathname: ({ href }: { href: string | { pathname: string; query: { q: string } } }) =>
    typeof href === "string"
      ? "/fa" + href
      : "/fa" + href.pathname + "?" + new URLSearchParams(href.query).toString(),
  useRouter: () => ({ push }),
}));

beforeEach(() => {
  vi.useFakeTimers();
  searchParams.delete("q");
  push.mockClear();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("search field", () => {
  it("starts search after a pause, using the most recent text", () => {
    renderWithIntl(<LibrarySearchBox pathname="/topics" />);
    const field = screen.getByRole("textbox", { name: messages.library.search.label });

    fireEvent.change(field, { target: { value: "su" } });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(push).not.toHaveBeenCalled();

    fireEvent.change(field, { target: { value: "sundhed" } });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(push).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(push).toHaveBeenCalledExactlyOnceWith(
      { pathname: "/topics/search", query: { q: "sundhed" } },
      { scroll: false },
    );
  });

  it("loads a shared query and clears it without a second navigation", () => {
    searchParams.set("q", "کار");
    const replace = vi.spyOn(window.history, "replaceState").mockImplementation(() => undefined);
    renderWithIntl(<LibrarySearchBox pathname="/topics/search" />);

    const field = screen.getByRole("textbox", { name: messages.library.search.label });
    expect(field).toHaveValue("کار");
    fireEvent.click(screen.getByRole("button", { name: messages.library.search.clear }));
    expect(field).toHaveValue("");
    expect(field).toHaveFocus();
    expect(replace).toHaveBeenCalledExactlyOnceWith(null, "", "/fa/topics/search");
    expect(push).not.toHaveBeenCalled();
  });
});
