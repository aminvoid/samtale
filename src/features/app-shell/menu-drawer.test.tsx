import { act, cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { afterEach, expect, it, vi } from "vitest";
import messages from "../../../messages/fa.json";
import { renderWithIntl } from "@/test/render-with-intl";
import { MenuDrawer } from "./menu-drawer";

vi.mock("@/i18n/navigation", () => ({
  usePathname: () => "/",
  Link: ({ onNavigate, ...props }: ComponentProps<"a"> & { onNavigate?: () => void }) => (
    <a {...props} onClick={onNavigate} />
  ),
}));

afterEach(() => {
  cleanup();
  vi.doUnmock("./menu-drawer-panel");
});

it("keeps focus while opening by keyboard and offers a retry if the drawer fails to load", async () => {
  const chunk = Promise.withResolvers<never>();
  vi.doMock("./menu-drawer-panel", () => chunk.promise);
  const user = userEvent.setup();
  renderWithIntl(<MenuDrawer />);
  const trigger = screen.getByRole("button", { name: messages.nav.menu });
  const status = screen.getByRole("status");

  await user.tab();
  await user.keyboard("{Enter}");
  expect(trigger).toHaveFocus();
  expect(trigger).toHaveAttribute("aria-busy", "true");
  expect(trigger).toHaveAttribute("aria-expanded", "false");
  expect(status).toHaveTextContent(messages.nav.menuLoading);

  act(() => {
    chunk.reject(new Error("drawer chunk failed"));
  });
  expect(await screen.findByText(messages.nav.menuLoadFailed)).toBe(status);
  expect(status).toHaveAttribute("aria-live", "polite");
  expect(trigger).toHaveFocus();
  expect(trigger).not.toHaveAttribute("aria-busy");
  expect(trigger).toHaveAttribute("aria-expanded", "false");

  vi.doUnmock("./menu-drawer-panel");
  await user.keyboard(" ");
  expect(await screen.findByRole("dialog", { name: messages.metadata.appName })).toBeVisible();
  expect(trigger).toHaveAttribute("aria-expanded", "true");
  expect(status).toBeEmptyDOMElement();
  await user.keyboard("{Escape}");
  expect(trigger).toHaveFocus();
  expect(trigger).toHaveAttribute("aria-expanded", "false");
});
