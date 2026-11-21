import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { expect, it } from "vitest";
import { renderWithIntl } from "@/test/render-with-intl";
import { ToggleIconButton } from "./toggle-icon-button";

const label = "نمایش زیرنویس";

function CaptionToggle() {
  const [state, setState] = useState<"off" | "on">("off");
  return (
    <ToggleIconButton
      label={label}
      icon="captions-off"
      pressedIcon="captions"
      pressed={state === "on"}
      onClick={() => {
        setState((previous) => (previous === "off" ? "on" : "off"));
      }}
    />
  );
}

it("changes the pressed state and icon without changing the accessible name", async () => {
  const user = userEvent.setup();
  renderWithIntl(<CaptionToggle />);

  const button = screen.getByRole("button", { name: label, pressed: false });
  expect(button.querySelector("svg")).toHaveClass("lucide-captions-off");
  expect(button).toHaveClass("aria-pressed:border-2", "aria-pressed:border-accent");
  await user.tab();
  await user.keyboard(" ");
  expect(screen.getByRole("button", { name: label, pressed: true })).toBe(button);
  expect(button.querySelector("svg")).toHaveClass("lucide-captions");
  expect(button.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  await user.click(button);
  expect(screen.getByRole("button", { name: label, pressed: false })).toBe(button);
});
