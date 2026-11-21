// @vitest-environment node
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import messages from "../../messages/fa.json";
import { routing } from "@/i18n/routing";
import GlobalError from "./global-error";

// next/font only works inside the Next.js compiler.
vi.mock("./fonts", () => ({ fontVariables: "font-vars" }));

describe("GlobalError", () => {
  it("renders a complete Persian RTL document with a retry button", () => {
    const html = renderToStaticMarkup(<GlobalError error={new Error("boom")} retry={() => undefined} />);
    expect(html).toMatch(/^<html lang="fa" dir="rtl" class="font-vars">/);
    expect(html).toContain(`<title>${messages.error.title}</title>`);
    expect(html).toContain(`<h1 class="text-2xl font-bold">${messages.error.title}</h1>`);
    expect(html).toContain(`>${messages.error.retry}</button>`);
  });

  it("uses the messages file of the default locale", () => {
    // global-error imports messages/fa.json statically; update it if the default locale changes.
    expect(routing.defaultLocale).toBe("fa");
  });
});
