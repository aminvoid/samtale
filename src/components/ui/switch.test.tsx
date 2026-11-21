import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getDirection } from "@/i18n/config";
import { renderWithIntl } from "@/test/render-with-intl";
import { DirectionProvider } from "./direction-provider";
import { Switch } from "./switch";

afterEach(cleanup);

describe("Switch", () => {
  it("uses the visible label as its name and toggles by click and Space in RTL", async () => {
    const user = userEvent.setup();
    const label = "نمایش ترجمه";
    const onChange = vi.fn();
    renderWithIntl(
      <DirectionProvider direction={getDirection("fa")}>
        <Switch label={label} onCheckedChange={onChange} />
      </DirectionProvider>,
    );

    const control = screen.getByRole("switch", { name: label, checked: false });
    expect(control).toHaveAttribute("dir", getDirection("fa"));
    await user.tab();
    expect(control).toHaveFocus();
    await user.keyboard(" ");
    expect(control).toBeChecked();
    await user.click(screen.getByText(label));
    expect(control).not.toBeChecked();
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it("exposes the reason on a focusable disabled switch", async () => {
    const user = userEvent.setup();
    const label = "نمایش ترجمه";
    const reason = "ترجمه در دسترس نیست";
    renderWithIntl(<Switch label={label} disabledReason={reason} />);

    const control = screen.getByRole("switch", { name: label, description: reason, checked: false });
    expect(control).toHaveAttribute("aria-disabled", "true");
    await user.tab();
    expect(control).toHaveFocus();
    await user.keyboard(" ");
    await user.click(control);
    expect(control).not.toBeChecked();
  });

  it("uses the muted thumb off and the raised thumb on", async () => {
    const user = userEvent.setup();
    const label = "نمایش ترجمه";
    renderWithIntl(<Switch label={label} />);

    const control = screen.getByRole("switch", { name: label, checked: false });
    const thumb = control.querySelector(".bg-text-muted");
    expect(thumb).toHaveAttribute("data-unchecked");
    expect(thumb).toHaveClass("data-checked:bg-surface-raised");
    await user.click(control);
    expect(thumb).toHaveAttribute("data-checked");
  });
});
