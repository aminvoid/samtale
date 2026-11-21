import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { renderWithIntl } from "@/test/render-with-intl";
import { RoleHeader, type ContentRole } from "./role-header";

afterEach(cleanup);

describe("RoleHeader", () => {
  it.each<{ role: ContentRole; ink: string; glyph: string }>([
    { role: "situation-intro", ink: "examiner", glyph: "message-circle" },
    { role: "first-question", ink: "examiner", glyph: "message-circle-question-mark" },
    { role: "second-question", ink: "examiner", glyph: "message-circle-question-mark" },
    { role: "followup", ink: "examiner", glyph: "message-circle-more" },
    { role: "examiner-line", ink: "examiner", glyph: "message-circle" },
    { role: "sample-answer", ink: "sample", glyph: "book-open-text" },
    { role: "short-sample-answer", ink: "sample", glyph: "book-open-text" },
    { role: "keywords", ink: "keyword", glyph: "key-round" },
    { role: "personal-example", ink: "example", glyph: "stethoscope" },
    { role: "learner-recording", ink: "you", glyph: "mic" },
  ])("pairs the caller's heading for $role with its icon and ink", ({ role, ink, glyph }) => {
    const label = "عنوان";
    const { container } = renderWithIntl(<RoleHeader role={role} label={label} as="h3" />);
    const heading = screen.getByRole("heading", { name: label, level: 3 });

    expect(heading.parentElement).toHaveClass(`text-role-${ink}`);
    const icon = container.querySelector("svg");
    expect(icon).toHaveClass(`lucide-${glyph}`);
    expect(icon).toHaveAttribute("aria-hidden", "true");
  });

  it("renders source and action slots beside a neutral translation label", () => {
    const label = "ترجمه";
    renderWithIntl(
      <RoleHeader
        role="translation"
        label={label}
        source={<span>متن این برنامه</span>}
        action={<button>خواندن</button>}
      />,
    );

    expect(screen.getByText("ترجمه").parentElement).toHaveClass("text-text-muted");
    expect(screen.getByText("متن این برنامه")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "خواندن" })).toBeInTheDocument();
  });
});
