// @vitest-environment node
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import messages from "../../messages/fa.json";
import { scripts } from "../../package.json";
import { routing } from "@/i18n/routing";
import GlobalError from "./global-error";
import { globalErrorMessages } from "./global-error-messages";

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
    // The strings are generated from messages/fa.json; update the script if the default locale changes.
    expect(routing.defaultLocale).toBe("fa");
  });

  it("ships strings that match messages/fa.json (run npm run i18n:global-error if this fails)", () => {
    expect(globalErrorMessages).toEqual({ title: messages.error.title, retry: messages.error.retry });
  });

  it("runs message generation before a direct npm run build", () => {
    expect(scripts.prebuild.split("&&").map((command) => command.trim())).toContain(
      "npm run i18n:global-error",
    );
    expect(scripts["i18n:global-error"]).toBe("node scripts/i18n/global-error-messages.ts");
  });
});
