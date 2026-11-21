import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { getDirection } from "@/i18n/config";
import { renderWithIntl } from "@/test/render-with-intl";
import { DirectionProvider } from "./direction-provider";
import { Tabs } from "./tabs";

const label = "نمایش موضوع‌ها";
const items = [
  { value: "themes", label: "موضوع‌ها", panel: "فهرست موضوع‌ها" },
  { value: "terms", label: "دوره‌ها", panel: "فهرست دوره‌ها" },
  { value: "settings", label: "تنظیمات", panel: "تنظیمات نمایش" },
];

afterEach(cleanup);

describe("Tabs", () => {
  it("moves focus in RTL, then opens the matching panel with Enter", async () => {
    const user = userEvent.setup();
    renderWithIntl(
      <DirectionProvider direction={getDirection("fa")}>
        <Tabs label={label} items={items} defaultValue="themes" />
      </DirectionProvider>,
    );

    const list = screen.getByRole("tablist", { name: label });
    const themes = within(list).getByRole("tab", { name: "موضوع‌ها", selected: true });
    const terms = within(list).getByRole("tab", { name: "دوره‌ها", selected: false });
    expect(screen.getByRole("tabpanel", { name: "موضوع‌ها" })).toBeVisible();
    expect(screen.queryByRole("tabpanel", { name: "دوره‌ها" })).not.toBeInTheDocument();

    await user.tab();
    expect(themes).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(terms).toHaveFocus();
    expect(themes).toHaveAttribute("aria-selected", "true");
    await user.keyboard("{Enter}");
    expect(terms).toHaveAttribute("aria-selected", "true");

    const panel = screen.getByRole("tabpanel", { name: "دوره‌ها" });
    expect(panel).toBeVisible();
    expect(panel.id).toBe(terms.getAttribute("aria-controls"));
    await user.keyboard("{ArrowRight}");
    expect(themes).toHaveFocus();
  });

  it("uses automatic activation when requested", async () => {
    const user = userEvent.setup();
    renderWithIntl(
      <DirectionProvider direction={getDirection("fa")}>
        <Tabs label={label} items={items} defaultValue="themes" activateOnFocus />
      </DirectionProvider>,
    );

    await user.tab();
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("tab", { name: "دوره‌ها", selected: true })).toHaveFocus();
    expect(screen.getByRole("tabpanel", { name: "دوره‌ها" })).toBeVisible();
  });

  it("styles the accent bar from the same selected state used in forced colours", () => {
    renderWithIntl(<Tabs label={label} items={items} defaultValue="terms" />);

    const tab = screen.getByRole("tab", { name: "دوره‌ها", selected: true });
    expect(tab).toHaveClass("aria-selected:after:bg-accent", "aria-selected:after:block-0.75");
    expect(tab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "موضوع‌ها", selected: false })).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });

  it("starts on the first enabled tab when no initial value is supplied", () => {
    renderWithIntl(
      <Tabs label={label} items={items.map((item) => ({ ...item, disabled: item.value === "themes" }))} />,
    );

    expect(screen.getByRole("tab", { name: "موضوع‌ها" })).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("tab", { name: "دوره‌ها", selected: true })).toBeInTheDocument();
    expect(screen.getByRole("tabpanel", { name: "دوره‌ها" })).toBeVisible();
  });
});
