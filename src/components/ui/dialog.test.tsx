import { cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRef } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { getDirection } from "@/i18n/config";
import { renderWithIntl } from "@/test/render-with-intl";
import { Button } from "./button";
import { Dialog } from "./dialog";
import { DirectionProvider } from "./direction-provider";

afterEach(cleanup);

describe("Dialog", () => {
  const title = "تنظیمات";
  const closeLabel = "بستن";

  it("labels the modal, traps focus in both directions and restores it on Escape", async () => {
    const user = userEvent.setup();
    renderWithIntl(
      <DirectionProvider direction={getDirection("fa")}>
        <Dialog
          title={title}
          closeLabel={closeLabel}
          description="تنظیمات خود را بررسی کنید"
          trigger={<Button>باز کردن تنظیمات</Button>}
        >
          <Button>ذخیره</Button>
        </Dialog>
        <Button>بعدی</Button>
      </DirectionProvider>,
    );

    const trigger = screen.getByRole("button", { name: "باز کردن تنظیمات" });
    await user.tab();
    expect(trigger).toHaveFocus();
    await user.keyboard("{Enter}");

    const dialog = await screen.findByRole("dialog", {
      name: title,
      description: "تنظیمات خود را بررسی کنید",
    });
    expect(dialog).toHaveAttribute("aria-labelledby");
    expect(dialog.closest("[dir]")).toHaveAttribute("dir", getDirection("fa"));
    const first = within(dialog).getByRole("button", { name: closeLabel });
    const last = within(dialog).getByRole("button", { name: "ذخیره" });

    await waitFor(() => {
      expect(first).toHaveFocus();
    });
    await user.tab({ shift: true });
    await waitFor(() => {
      expect(last).toHaveFocus();
    });
    await user.tab();
    await waitFor(() => {
      expect(first).toHaveFocus();
    });

    await user.keyboard("{Escape}");
    await waitFor(() => {
      expect(trigger).toHaveFocus();
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("supports an explicit initial focus and the named close button", async () => {
    const user = userEvent.setup();

    function Fixture() {
      const initial = useRef<HTMLButtonElement>(null);
      return (
        <Dialog
          title={title}
          closeLabel={closeLabel}
          initialFocus={initial}
          trigger={<button>باز کردن تنظیمات</button>}
        >
          <button ref={initial}>ادامه</button>
        </Dialog>
      );
    }

    renderWithIntl(<Fixture />);
    const trigger = screen.getByRole("button", { name: "باز کردن تنظیمات" });
    await user.click(trigger);
    const dialog = await screen.findByRole("dialog", { name: title });
    await waitFor(() => {
      expect(within(dialog).getByRole("button", { name: "ادامه" })).toHaveFocus();
    });
    await user.click(within(dialog).getByRole("button", { name: closeLabel }));
    await waitFor(() => {
      expect(trigger).toHaveFocus();
    });
  });
});
