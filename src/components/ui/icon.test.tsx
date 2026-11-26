import { cleanup, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { getDirection } from "@/i18n/config";
import { renderWithIntl } from "@/test/render-with-intl";
import {
  IconArrowLeft,
  IconArrowRight,
  IconChevronLeft,
  IconChevronRight,
  IconClock3,
  IconExternalLink,
  IconLogOut,
  IconMessageCircleQuestionMark,
  IconMic,
  IconPause,
  IconPlay,
  IconRepeat2,
  IconRotateCcw,
  IconVolume2,
} from "./icon";

afterEach(cleanup);

describe("Icon", () => {
  const label = "نماد";

  it.each([IconArrowLeft, IconArrowRight, IconChevronLeft, IconChevronRight, IconExternalLink, IconLogOut])(
    "mirrors $name automatically only in RTL",
    (Glyph) => {
      renderWithIntl(
        <div dir={getDirection("fa")}>
          <Glyph label={label} size={16} />
        </div>,
      );

      const icon = screen.getByRole("img", { name: label });
      expect(icon).toHaveClass("rtl:-scale-x-100");
      expect(icon).toHaveAttribute("stroke-width", "2");
      expect(icon).toHaveAttribute("width", "16");
    },
  );

  it.each([
    IconPlay,
    IconPause,
    IconRotateCcw,
    IconRepeat2,
    IconClock3,
    IconMic,
    IconVolume2,
    IconMessageCircleQuestionMark,
  ])("never mirrors $name, even when mirroring is requested", (Glyph) => {
    renderWithIntl(<Glyph label={label} mirrored />);
    expect(screen.getByRole("img", { name: label })).not.toHaveClass("rtl:-scale-x-100");
  });

  it("supports opting out for a directional glyph and defaults to decorative", () => {
    renderWithIntl(
      <button>
        <IconChevronRight mirrored={false} />
        ادامه
      </button>,
    );
    const button = screen.getByRole("button", { name: "ادامه" });

    expect(within(button).queryByRole("img")).not.toBeInTheDocument();
    expect(button.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    expect(button.querySelector("svg")).not.toHaveClass("rtl:-scale-x-100");
  });
});
