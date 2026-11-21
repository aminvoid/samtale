import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getDirection } from "@/i18n/config";
import { renderWithIntl } from "@/test/render-with-intl";
import { DirectionProvider } from "./direction-provider";
import { SegmentedControl } from "./segmented-control";

afterEach(cleanup);

describe("SegmentedControl", () => {
  it("selects and focuses the next enabled radio to the left in RTL", async () => {
    const user = userEvent.setup();
    const label = "سرعت";
    const onChange = vi.fn();
    renderWithIntl(
      <DirectionProvider direction={getDirection("fa")}>
        <SegmentedControl
          label={label}
          defaultValue="normal"
          onValueChange={onChange}
          options={[
            { value: "normal", label: "عادی" },
            { value: "slow", label: "آهسته", disabled: true },
            { value: "fast", label: "سریع" },
            { value: "max", label: "بیشترین سرعت" },
          ]}
        />
      </DirectionProvider>,
    );

    const group = screen.getByRole("radiogroup", { name: label });
    const normal = within(group).getByRole("radio", { name: "عادی", checked: true });
    const fast = within(group).getByRole("radio", { name: "سریع", checked: false });
    expect(normal.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    expect(fast.querySelector("svg")).toBeNull();
    await user.tab();
    expect(normal).toHaveFocus();

    await user.keyboard("{ArrowLeft}");
    expect(fast).toHaveFocus();
    expect(fast).toBeChecked();
    expect(fast.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    expect(normal.querySelector("svg")).toBeNull();
    expect(onChange).toHaveBeenCalledWith("fast", expect.anything());

    await user.keyboard("{ArrowRight}");
    expect(normal).toHaveFocus();
    expect(normal).toBeChecked();
  });

  it("shows the selection cue for a disabled checked option", () => {
    const label = "سرعت";
    const option = "عادی";
    renderWithIntl(
      <SegmentedControl
        label={label}
        disabled
        defaultValue="normal"
        options={[{ value: "normal", label: option }]}
      />,
    );

    const radio = screen.getByRole("radio", { name: option, checked: true });
    expect(radio).toBeDisabled();
    expect(radio.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });
});
