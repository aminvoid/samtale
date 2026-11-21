import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getDirection } from "@/i18n/config";
import { renderWithIntl } from "@/test/render-with-intl";
import { TermLabel } from "./term-label";

describe("TermLabel", () => {
  it("isolates Danish term text and keeps its Latin digits in an RTL row", () => {
    renderWithIntl(
      <div dir={getDirection("fa")}>
        <TermLabel variant="chip">Maj–Juni 2024 · B</TermLabel>
      </div>,
    );

    const label = screen.getByText("Maj–Juni 2024 · B");
    expect(label.tagName).toBe("BDI");
    expect(label).toHaveAttribute("dir", "ltr");
    expect(label).toHaveAttribute("lang", "da");
    expect(label).toHaveClass("rounded-chip", "tabular-nums");
  });
});
