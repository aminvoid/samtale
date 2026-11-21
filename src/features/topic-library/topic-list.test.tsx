import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import messages from "../../../messages/fa.json";
import { renderWithIntl } from "@/test/render-with-intl";
import { currentTopic, olderTopic } from "./library-fixtures.test-data";
import { TopicList } from "./topic-list";

vi.mock("@/i18n/navigation", async () => {
  const { MockLocaleLink } = await import("./library-fixtures.test-data");
  return { Link: MockLocaleLink };
});

afterEach(cleanup);

describe("topic list", () => {
  it("links each title to its topic and explains older topics outside the links", async () => {
    const user = userEvent.setup();
    renderWithIntl(<TopicList topics={[currentTopic, olderTopic]} />);

    const current = screen.getByRole("link", { name: /^Arbejde på et hospital/ });
    const older = screen.getByRole("link", { name: /^Pension/ });
    expect(current).toHaveAttribute("href", "/fa/topics/2024-maj-b");
    expect(within(current).getByText(currentTopic.title.da)).toHaveAttribute("lang", "da");
    expect(within(current).getByText("Maj–Juni 2024 · B")).toHaveAttribute("dir", "ltr");
    expect(within(current).queryByText(messages.library.olderShort)).not.toBeInTheDocument();
    expect(within(older).getByText(messages.library.olderShort)).toBeVisible();
    expect(within(older).queryByRole("button")).not.toBeInTheDocument();
    expect(within(older).queryByRole("link")).not.toBeInTheDocument();

    const explain = screen.getByRole("button", { name: messages.library.olderInfo });
    expect(explain).toHaveAttribute("aria-expanded", "false");
    await user.click(explain);
    expect(explain).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(messages.library.olderExplanation)).toBeVisible();
  });
});
