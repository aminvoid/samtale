import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render-with-intl";
import { IconX } from "./icon";
import { IconButton } from "./icon-button";

describe("IconButton", () => {
  it("exposes the supplied name on the button and hides the glyph", async () => {
    const label = "بستن";
    const onClick = vi.fn();
    const user = userEvent.setup();
    renderWithIntl(<IconButton label={label} icon={<IconX />} onClick={onClick} />);

    const button = screen.getByRole("button", { name: label });
    expect(button.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    await user.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });
});
