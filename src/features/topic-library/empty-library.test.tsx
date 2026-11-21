import { cleanup, screen } from "@testing-library/react";
import { createTranslator } from "next-intl";
import { afterEach, expect, it, vi } from "vitest";
import messages from "../../../messages/fa.json";
import { buildFormats } from "@/i18n/formats";
import { renderWithIntl } from "@/test/render-with-intl";
import { SimilarQuestions } from "./similar-questions";
import { TermsScreen } from "./terms-screen";

vi.mock("next-intl/server", () => ({
  getTranslations: (namespace: "library") =>
    Promise.resolve(createTranslator({ locale: "fa", messages, namespace, formats: buildFormats("fa") })),
}));

vi.mock("@/lib/content/repository", () => ({ getTopic: vi.fn() }));

vi.mock("@/i18n/navigation", async () => {
  const { MockLocaleLink } = await import("./library-fixtures.test-data");
  return { Link: MockLocaleLink };
});

afterEach(cleanup);

it("shows the empty terms message when no terms have published topics", async () => {
  renderWithIntl(await TermsScreen({ terms: [], topics: [] }));
  expect(screen.getByText(messages.library.empty)).toBeVisible();
  expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
});

it("shows the empty similar questions message and a link to themes when there are no groups", async () => {
  renderWithIntl(await SimilarQuestions({ groups: [], topics: [] }));
  expect(screen.getByText(messages.library.similar.empty)).toBeVisible();
  expect(screen.getByRole("link", { name: messages.library.search.browseInstead })).toHaveAttribute(
    "href",
    "/fa/topics",
  );
});
