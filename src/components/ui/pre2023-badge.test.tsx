import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { renderWithIntl } from "@/test/render-with-intl";
import { Pre2023Badge } from "./pre2023-badge";

afterEach(cleanup);

describe("Pre2023Badge", () => {
  it("renders a plain label without an interactive element", () => {
    renderWithIntl(<Pre2023Badge>قالب قدیمی</Pre2023Badge>);
    expect(screen.getByText("قالب قدیمی")).toBeVisible();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("opens the supplemental explanation with a keyboard action", async () => {
    const user = userEvent.setup();
    const label = "این یعنی چه؟";
    const explanation = "این موضوع با قالب امروز اجرا می‌شود";
    renderWithIntl(
      <Pre2023Badge variant="explained" explanationLabel={label} explanation={explanation}>
        قالب قدیمی
      </Pre2023Badge>,
    );

    expect(screen.getByText(explanation)).not.toBeVisible();
    await user.tab();
    expect(screen.getByRole("button", { name: label, expanded: false })).toHaveFocus();
    await user.keyboard("{Enter}");
    await waitFor(() => {
      expect(screen.getByText(explanation)).toBeVisible();
    });
  });
});
