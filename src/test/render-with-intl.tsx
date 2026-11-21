import { render, type RenderOptions } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactElement } from "react";
import messages from "../../messages/fa.json";
import { TIME_ZONE } from "@/i18n/config";
import { buildFormats } from "@/i18n/formats";

/** Renders with the real fa messages, so tests catch missing or wrong strings (testing rule). */
export function renderWithIntl(ui: ReactElement, options?: RenderOptions) {
  return render(
    <NextIntlClientProvider locale="fa" messages={messages} formats={buildFormats("fa")} timeZone={TIME_ZONE}>
      {ui}
    </NextIntlClientProvider>,
    options,
  );
}
