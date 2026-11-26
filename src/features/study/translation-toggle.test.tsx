import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it } from "vitest";
import messages from "../../../messages/fa.json";
import { renderWithIntl } from "@/test/render-with-intl";
import { TranslationToggle } from "./translation-toggle";

afterEach(cleanup);

it("renders a multi-word name in one left-to-right isolate inside the Persian translation", async () => {
  const user = userEvent.setup();
  const text = "از Too Good To Go، استفاده کرد.";
  const { container } = renderWithIntl(
    <TranslationToggle text={text} answerLabel={messages.study.shortAnswerTranslation} />,
  );

  await user.click(screen.getByRole("button", { name: messages.study.shortAnswerTranslation }));

  const name = screen.getByText("Too Good To Go", { selector: "bdi" });
  expect(name).toBeVisible();
  expect(name).toHaveAttribute("dir", "ltr");
  expect(name).toHaveAttribute("lang", "da");
  expect(container.querySelectorAll("bdi")).toHaveLength(1);
  expect(name.parentElement).toHaveAttribute("dir", "rtl");
  expect(name.parentElement).toHaveTextContent(text);
});
