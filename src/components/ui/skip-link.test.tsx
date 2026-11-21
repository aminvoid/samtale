import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import messages from "../../../messages/fa.json";
import { renderWithIntl } from "@/test/render-with-intl";
import { SkipLink } from "./skip-link";

describe("SkipLink", () => {
  it("is the first tab stop and links to main", async () => {
    const user = userEvent.setup();
    renderWithIntl(
      <>
        <SkipLink>{messages.common.skipToContent}</SkipLink>
        <button>ادامه</button>
        <main id="main" tabIndex={-1} />
      </>,
    );

    const link = screen.getByRole("link", { name: messages.common.skipToContent });
    expect(link).toHaveAttribute("href", "#main");
    expect(link).toHaveClass("skip-link");
    await user.tab();
    expect(link).toHaveFocus();
  });
});
