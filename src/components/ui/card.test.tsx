import { cleanup, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render-with-intl";
import { Card } from "./card";

vi.mock("@/i18n/navigation", () => ({
  Link: (props: ComponentProps<"a">) => <a {...props} />,
}));

afterEach(cleanup);

describe("Card", () => {
  it("renders static content without adding a tab stop", () => {
    renderWithIntl(
      <Card>
        <h2>موضوع‌ها</h2>
      </Card>,
    );

    const heading = screen.getByRole("heading", { level: 2, name: "موضوع‌ها" });
    expect(heading.parentElement).not.toHaveAttribute("tabindex");
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("uses one named link for the whole interactive card", () => {
    renderWithIntl(<Card href="/topics">موضوع‌ها</Card>);

    expect(screen.getByRole("link", { name: "موضوع‌ها" })).toHaveAttribute("href", "/topics");
  });
});
