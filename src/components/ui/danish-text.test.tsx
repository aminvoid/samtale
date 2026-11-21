import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "@/test/render-with-intl";
import { DanishText } from "./danish-text";

describe("DanishText", () => {
  it("marks Danish as lang=da and dir=ltr", () => {
    renderWithIntl(<DanishText as="p">Hvorfor tror du, de kan det?</DanishText>);
    const el = screen.getByText("Hvorfor tror du, de kan det?");
    expect(el.tagName).toBe("P");
    expect(el).toHaveAttribute("lang", "da");
    expect(el).toHaveAttribute("dir", "ltr");
  });

  it("renders a span by default without an empty class attribute", () => {
    renderWithIntl(<DanishText>Undskyld</DanishText>);
    const el = screen.getByText("Undskyld");
    expect(el.tagName).toBe("SPAN");
    expect(el).not.toHaveAttribute("class");
  });

  it("renders a blockquote with id, class and aria attributes passed through", () => {
    renderWithIntl(
      <DanishText as="blockquote" id="answer" className="text-lg" aria-describedby="hint">
        Jeg tror, at det er vigtigt.
      </DanishText>,
    );
    const el = screen.getByText("Jeg tror, at det er vigtigt.");
    expect(el.tagName).toBe("BLOCKQUOTE");
    expect(el).toHaveAttribute("id", "answer");
    expect(el).toHaveClass("text-lg");
    expect(el).toHaveAttribute("aria-describedby", "hint");
  });

  it("isolates its own direction, so text inside it needs no nested <bdi>", () => {
    renderWithIntl(<DanishText as="h2">Arbejde, 2024 (A)</DanishText>);
    const heading = screen.getByRole("heading", { level: 2, name: "Arbejde, 2024 (A)" });
    expect(heading).toHaveAttribute("dir", "ltr");
    expect(heading.querySelector("bdi")).toBeNull();
  });
});
