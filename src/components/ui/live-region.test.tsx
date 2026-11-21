import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "@/test/render-with-intl";
import { LiveRegion } from "./live-region";

describe("LiveRegion", () => {
  it("updates the already mounted polite status without moving focus", async () => {
    const user = userEvent.setup();

    function Fixture() {
      const [status, setStatus] = useState("");
      return (
        <>
          <button
            onClick={() => {
              setStatus("انجام شد");
            }}
          >
            ادامه
          </button>
          <LiveRegion>{status}</LiveRegion>
        </>
      );
    }

    renderWithIntl(<Fixture />);
    const status = screen.getByRole("status");
    const button = screen.getByRole("button", { name: "ادامه" });

    await user.tab();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("status")).toBe(status);
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveAttribute("aria-atomic", "true");
    expect(status).toHaveTextContent("انجام شد");
    expect(button).toHaveFocus();
  });
});
