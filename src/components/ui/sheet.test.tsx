import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { getDirection } from "@/i18n/config";
import { renderWithIntl } from "@/test/render-with-intl";
import { DirectionProvider } from "./direction-provider";
import { Sheet } from "./sheet";

describe("Sheet", () => {
  it("opens a named RTL modal and returns focus when dismissed", async () => {
    const user = userEvent.setup();
    const title = "راهنمایی";
    const closeLabel = "بستن";
    renderWithIntl(
      <DirectionProvider direction={getDirection("fa")}>
        <Sheet title={title} closeLabel={closeLabel} trigger={<button>نمایش راهنما</button>}>
          <p>این راهنما را بخوانید</p>
        </Sheet>
      </DirectionProvider>,
    );

    const trigger = screen.getByRole("button", { name: "نمایش راهنما" });
    await user.click(trigger);
    const sheet = await screen.findByRole("dialog", { name: title });

    expect(sheet.closest("[dir]")).toHaveAttribute("dir", getDirection("fa"));
    expect(sheet).toHaveClass("rounded-ss-sheet", "rounded-se-sheet");
    await user.click(within(sheet).getByRole("button", { name: closeLabel }));
    await waitFor(() => {
      expect(trigger).toHaveFocus();
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
