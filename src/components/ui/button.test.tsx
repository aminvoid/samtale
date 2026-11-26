import { cleanup, fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render-with-intl";
import { Button } from "./button";

afterEach(cleanup);

describe("Button", () => {
  it("activates as a native button and defaults to a non-submit action", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    renderWithIntl(<Button onClick={onClick}>ادامه</Button>);

    const button = screen.getByRole("button", { name: "ادامه" });
    expect(button).toHaveAttribute("type", "button");
    await user.tab();
    await user.keyboard("{Enter}");
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("keeps its label and focus while loading and ignores activation", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    renderWithIntl(
      <Button loading onClick={onClick}>
        ادامه
      </Button>,
    );

    const button = screen.getByRole("button", { name: "ادامه", busy: true });
    expect(button).toHaveAttribute("aria-disabled", "true");
    await user.tab();
    expect(button).toHaveFocus();
    await user.keyboard("{Enter}");
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
    expect(button.querySelector("svg")).toHaveClass("motion-safe:animate-spin");
  });

  it("doesn't run the caller's pointer or key handlers while loading, and runs them once ready", async () => {
    const handlers = { onPointerDown: vi.fn(), onMouseDown: vi.fn(), onKeyDown: vi.fn(), onKeyUp: vi.fn() };
    const user = userEvent.setup();
    const { rerender } = renderWithIntl(
      <Button loading {...handlers}>
        ادامه
      </Button>,
    );

    const button = screen.getByRole("button", { name: "ادامه" });
    fireEvent.pointerDown(button);
    await user.click(button);
    await user.tab();
    await user.keyboard("{Enter}");
    for (const handler of Object.values(handlers)) expect(handler).not.toHaveBeenCalled();

    rerender(<Button {...handlers}>ادامه</Button>);
    const ready = screen.getByRole("button", { name: "ادامه" });
    fireEvent.pointerDown(ready);
    await user.click(ready);
    ready.focus();
    await user.keyboard("{Enter}");
    for (const [name, handler] of Object.entries(handlers)) expect(handler, name).toHaveBeenCalled();
  });

  it("associates the visible reason and blocks activation on a focusable disabled button", async () => {
    const reason = "ابتدا موضوعی انتخاب کنید";
    const onClick = vi.fn();
    const user = userEvent.setup();
    renderWithIntl(
      <Button disabledReason={reason} onClick={onClick}>
        ادامه
      </Button>,
    );

    const button = screen.getByRole("button", { name: "ادامه", description: reason });
    expect(button).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByText(reason)).toBeVisible();
    await user.tab();
    expect(button).toHaveFocus();
    await user.keyboard(" ");
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("skips a natively disabled button in the tab order", async () => {
    const user = userEvent.setup();
    renderWithIntl(
      <>
        <Button disabled>ادامه</Button>
        <Button>بازگشت</Button>
      </>,
    );

    expect(screen.getByRole("button", { name: "ادامه" })).toBeDisabled();
    await user.tab();
    expect(screen.getByRole("button", { name: "بازگشت" })).toHaveFocus();
  });

  it("preserves keyboard focus when a disabled reason appears on the active button", async () => {
    const user = userEvent.setup();
    const reason = "موضوع دیگری انتخاب کنید";

    function Fixture() {
      const [disabled, setDisabled] = useState(false);
      return (
        <Button
          disabledReason={disabled ? reason : undefined}
          onClick={() => {
            setDisabled(true);
          }}
        >
          ادامه
        </Button>
      );
    }

    renderWithIntl(<Fixture />);
    await user.tab();
    const button = screen.getByRole("button", { name: "ادامه" });
    expect(button).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(button).toHaveFocus();
    expect(button).toHaveAccessibleDescription(reason);
  });
});
