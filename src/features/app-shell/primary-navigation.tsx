"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/icon";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils/cn";
import { isCurrentSection, primaryLinks, progressLink } from "./section-links";

export function PrimaryNavigation({ variant }: { variant: "top" | "bottom" }) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const bottom = variant === "bottom";
  const links = bottom ? primaryLinks : [...primaryLinks, progressLink];

  return (
    <nav
      aria-label={t("primary")}
      data-sticky={bottom ? "tab-bar" : undefined}
      className={
        bottom
          ? "fixed inset-x-0 inset-be-0 z-40 border-bs border-border bg-surface-raised pbe-[env(safe-area-inset-bottom)] shadow-raised md:hidden short:static"
          : "hidden md:block"
      }
    >
      <ul className={bottom ? "grid grid-cols-5" : "flex flex-wrap justify-center gap-x-4"}>
        {links.map((item) => {
          const current = isCurrentSection(pathname, item);
          return (
            <li key={item.href} className={bottom ? "flex min-inline-0" : undefined}>
              <Link
                href={item.href}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "relative flex items-center justify-center text-center focus-visible:z-10",
                  bottom
                    ? "flex-1 flex-col gap-0.5 px-0.5 py-1.5 text-label wrap-anywhere min-block-tabbar min-inline-0 focus-visible:-outline-offset-3"
                    : "border-be-3 border-transparent px-1 text-ui font-semibold min-block-touch hover:underline",
                  current ? "font-bold text-accent" : "text-text-muted hover:text-text",
                  current &&
                    bottom &&
                    "before:absolute before:inset-bs-0 before:bg-accent before:block-0.75 before:inline-8",
                  current && !bottom && "border-accent",
                )}
              >
                {bottom && (
                  <span
                    className={cn(
                      "grid place-items-center rounded-full block-8 inline-14 max-inline-full",
                      current && "bg-accent-subtle",
                    )}
                  >
                    <Icon name={item.icon} size={24} />
                  </span>
                )}
                {t(bottom ? item.label : (item.fullLabel ?? item.label))}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
