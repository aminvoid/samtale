import { notFound } from "next/navigation";
import * as rootParams from "next/root-params";
import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { TIME_ZONE } from "./config";
import { buildFormats } from "./formats";
import { routing } from "./routing";

export default getRequestConfig(async ({ locale }) => {
  const candidate = locale ?? (await rootParams.locale());
  if (!hasLocale(routing.locales, candidate)) notFound();
  return {
    locale: candidate,
    // A locale-keyed dynamic JSON import is untyped. Its shape is guaranteed by the messages parity test
    // (every messages/*.json has exactly fa.json's keys and ICU arguments), and keeping it dynamic means
    // adding a locale needs no code change here (ADR-0004).
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access -- see above
    messages: (await import(`../../messages/${candidate}.json`)).default,
    formats: buildFormats(candidate),
    timeZone: TIME_ZONE,
  };
});
