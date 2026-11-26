"use client";

import { useTranslations } from "next-intl";
import type { RefObject } from "react";
import { DanishText } from "@/components/ui/danish-text";
import { Dialog } from "@/components/ui/dialog";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils/cn";
import { sectionIcons } from "./section-icons";
import { isCurrentSection, primaryLinks, progressLink, utilityLinks } from "./section-links";

/** The drawer itself. MenuDrawer loads it on first use, so Base UI's dialog isn't in every page's JS. */
export function MenuDrawerPanel({
  open,
  onOpenChange,
  trigger,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: RefObject<HTMLButtonElement | null>;
}) {
  const t = useTranslations("nav");
  const metadata = useTranslations("metadata");
  const pathname = usePathname();

  return (
    <Dialog
      presentation="drawer"
      title={<DanishText as="bdi">{metadata("appName")}</DanishText>}
      closeLabel={t("close")}
      open={open}
      onOpenChange={onOpenChange}
      finalFocus={trigger}
    >
      <nav aria-label={t("primary")}>
        {[[...primaryLinks, progressLink], utilityLinks].map((links, index) => (
          <ul key={index} className={index === 0 ? undefined : "mbs-3 border-bs border-border pbs-3"}>
            {links.map((item) => {
              const current = isCurrentSection(pathname, item);
              const SectionIcon = sectionIcons[item.label];
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onNavigate={() => {
                      onOpenChange(false);
                    }}
                    aria-current={current ? "page" : undefined}
                    className={cn(
                      "relative flex items-center gap-3 rounded-control px-3 py-2 text-ui min-block-touch hover:bg-surface-sunken",
                      current &&
                        "bg-accent-subtle font-bold text-accent before:absolute before:inset-y-2 before:start-0 before:rounded-full before:bg-accent before:inline-0.75",
                    )}
                  >
                    <SectionIcon />
                    {t(item.fullLabel ?? item.label)}
                  </Link>
                </li>
              );
            })}
          </ul>
        ))}
      </nav>
    </Dialog>
  );
}
