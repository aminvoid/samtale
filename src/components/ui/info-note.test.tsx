import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render-with-intl";
import { CollapsibleInfoNote } from "./collapsible-info-note";
import { DismissibleInfoNote } from "./dismissible-info-note";
import { InfoNote } from "./info-note";

afterEach(cleanup);

describe("InfoNote", () => {
  it("renders the caller's compact note without a control", () => {
    renderWithIntl(<InfoNote variant="compact">یادداشت</InfoNote>);
    expect(screen.getByText("یادداشت")).toHaveClass("text-caption");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("only shows a collapsible note body when expanded", async () => {
    const user = userEvent.setup();
    const label = "راهنمایی";
    renderWithIntl(<CollapsibleInfoNote label={label}>یادداشت</CollapsibleInfoNote>);

    expect(screen.getByText("یادداشت")).not.toBeVisible();
    await user.click(screen.getByRole("button", { name: label, expanded: false }));
    await waitFor(() => {
      expect(screen.getByText("یادداشت")).toBeVisible();
    });
  });

  it("removes a dismissible note through its named close action", async () => {
    const user = userEvent.setup();
    const dismissLabel = "بستن این یادداشت";
    const onDismiss = vi.fn();
    renderWithIntl(
      <DismissibleInfoNote dismissLabel={dismissLabel} onDismiss={onDismiss}>
        یادداشت
      </DismissibleInfoNote>,
    );

    await user.click(screen.getByRole("button", { name: dismissLabel }));
    expect(screen.queryByText("یادداشت")).not.toBeInTheDocument();
    expect(onDismiss).toHaveBeenCalledOnce();
  });
});
