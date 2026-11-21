import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "@/test/render-with-intl";
import { ThemeIcon } from "./theme-icon";

describe("ThemeIcon", () => {
  it("renders the housing icon as a decorative building", () => {
    renderWithIntl(
      <button>
        <ThemeIcon themeId="bolig" size={24} />
        مسکن
      </button>,
    );
    const button = screen.getByRole("button", { name: "مسکن" });

    expect(within(button).queryByRole("img")).not.toBeInTheDocument();
    const icon = button.querySelector("svg");
    expect(icon).toHaveClass("lucide-building-complex");
    expect(icon).not.toHaveClass("rtl:-scale-x-100");
    expect(icon).toHaveAttribute("height", "24");
  });
});
