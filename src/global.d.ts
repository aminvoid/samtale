import type messages from "../messages/fa.json";
import type { AppFormats } from "@/i18n/formats";
import type { AppLocale } from "@/i18n/routing";

declare module "next-intl" {
  interface AppConfig {
    Locale: AppLocale;
    Messages: typeof messages;
    Formats: AppFormats;
  }
}
