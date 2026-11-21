import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { renderWithIntl } from "@/test/render-with-intl";
import { Disclosure } from "./disclosure";

afterEach(cleanup);

describe("Disclosure", () => {
  it("toggles its linked panel from the keyboard", async () => {
    const user = userEvent.setup();
    const label = "جزئیات";
    renderWithIntl(
      <Disclosure label={label}>
        <button>ادامه</button>
      </Disclosure>,
    );

    const trigger = screen.getByRole("button", { name: label, expanded: false });
    expect(screen.queryByRole("heading")).toBeNull();
    expect(trigger).toHaveAttribute("aria-controls");
    expect(screen.queryByRole("button", { name: "ادامه" })).not.toBeInTheDocument();
    await user.tab();
    await user.keyboard(" ");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    const content = screen.getByRole("button", { name: "ادامه" });
    expect(content.parentElement?.id).toBe(trigger.getAttribute("aria-controls"));
    await user.keyboard("{Enter}");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await waitFor(() => {
      expect(content).not.toBeVisible();
    });
  });

  it("places only the trigger inside the heading and keeps its name when expanded", async () => {
    const user = userEvent.setup();
    const label = "جزئیات";
    renderWithIntl(
      <Disclosure label={label} heading="h3">
        <p>متن بیشتر</p>
      </Disclosure>,
    );

    const heading = screen.getByRole("heading", { level: 3, name: label });
    const trigger = screen.getByRole("button", { name: label, expanded: false });
    expect(heading.firstElementChild).toBe(trigger);
    expect(heading.childElementCount).toBe(1);
    await user.click(trigger);
    expect(screen.getByRole("button", { name: label, expanded: true })).toBe(trigger);
    expect(heading.nextElementSibling).toHaveAttribute("id", trigger.getAttribute("aria-controls"));
  });
});
