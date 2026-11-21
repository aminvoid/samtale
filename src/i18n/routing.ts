import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["fa"],
  defaultLocale: "fa",
  localePrefix: "always",
  localeCookie: false,
});

export type AppLocale = (typeof routing.locales)[number];
