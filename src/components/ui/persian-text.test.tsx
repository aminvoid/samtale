import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getDirection } from "@/i18n/config";
import { renderWithIntl } from "@/test/render-with-intl";
import { PersianText } from "./persian-text";

describe("PersianText", () => {
  it("sets the language and direction of an isolated translation", () => {
    renderWithIntl(
      <div dir="ltr">
        <PersianText as="p" variant="translation">
          ترجمه
        </PersianText>
      </div>,
    );

    const paragraph = screen.getByRole("paragraph");
    expect(paragraph).toHaveAttribute("lang", "fa");
    expect(paragraph).toHaveAttribute("dir", getDirection("fa"));
    expect(paragraph).toHaveClass(
      "text-(length:--text-fa-translation)/(--text-fa-translation--line-height)",
      "text-text-muted",
    );
  });
});
