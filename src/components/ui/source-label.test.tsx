import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "@/test/render-with-intl";
import { SourceLabel } from "./source-label";

describe("SourceLabel", () => {
  it("shows provenance in text with a decorative variant icon", () => {
    const { container } = renderWithIntl(<SourceLabel variant="app-from-siri">متن این برنامه</SourceLabel>);

    expect(screen.getByText("متن این برنامه")).toBeVisible();
    const icon = container.querySelector("svg");
    expect(icon).toHaveClass("lucide-pen-line");
    expect(icon).toHaveAttribute("aria-hidden", "true");
  });
});
