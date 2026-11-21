import { cleanup, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { getDirection } from "@/i18n/config";
import { renderWithIntl } from "@/test/render-with-intl";
import { Icon, type IconName } from "./icon";

afterEach(cleanup);

describe("Icon", () => {
  const label = "نماد";

  it.each<IconName>([
    "arrow-left",
    "arrow-right",
    "chevron-left",
    "chevron-right",
    "external-link",
    "log-out",
  ])("mirrors %s automatically only in RTL", (name) => {
    renderWithIntl(
      <div dir={getDirection("fa")}>
        <Icon name={name} label={label} size={16} />
      </div>,
    );

    const icon = screen.getByRole("img", { name: label });
    expect(icon).toHaveClass("rtl:-scale-x-100");
    expect(icon).toHaveAttribute("stroke-width", "2");
    expect(icon).toHaveAttribute("width", "16");
  });

  it.each<IconName>([
    "play",
    "pause",
    "rotate-ccw",
    "repeat-2",
    "clock-3",
    "mic",
    "volume-2",
    "message-circle-question-mark",
  ])("never mirrors %s, even when mirroring is requested", (name) => {
    renderWithIntl(<Icon name={name} label={label} mirrored />);
    expect(screen.getByRole("img", { name: label })).not.toHaveClass("rtl:-scale-x-100");
  });

  it("supports opting out for a directional glyph and defaults to decorative", () => {
    renderWithIntl(
      <button>
        <Icon name="chevron-right" mirrored={false} />
        ادامه
      </button>,
    );
    const button = screen.getByRole("button", { name: "ادامه" });

    expect(within(button).queryByRole("img")).not.toBeInTheDocument();
    expect(button.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    expect(button.querySelector("svg")).not.toHaveClass("rtl:-scale-x-100");
  });
});
