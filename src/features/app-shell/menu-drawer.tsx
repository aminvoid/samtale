"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { DanishText } from "@/components/ui/danish-text";
import { Dialog } from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { IconButton } from "@/components/ui/icon-button";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils/cn";
import { isCurrentSection, primaryLinks, progressLink, utilityLinks } from "./section-links";

export function MenuDrawer() {
  const t = useTranslations("nav");
  const metadata = useTranslations("metadata");
  const pathname = usePathname();
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const open = openedAt === pathname;
  if (openedAt !== null && !open) setOpenedAt(null);

  return (
    <Dialog
      presentation="drawer"
      title={<DanishText as="bdi">{metadata("appName")}</DanishText>}
      closeLabel={t("close")}
      trigger={<IconButton icon="menu" label={t("menu")} />}
      open={open}
      onOpenChange={(nextOpen) => {
        setOpenedAt(nextOpen ? pathname : null);
      }}
    >
      <nav aria-label={t("primary")}>
        {[[...primaryLinks, progressLink], utilityLinks].map((links, index) => (
          <ul key={index} className={index === 0 ? undefined : "mbs-3 border-bs border-border pbs-3"}>
            {links.map((item) => {
              const current = isCurrentSection(pathname, item);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onNavigate={() => {
                      setOpenedAt(null);
                    }}
                    aria-current={current ? "page" : undefined}
                    className={cn(
                      "relative flex items-center gap-3 rounded-control px-3 py-2 text-ui min-block-touch hover:bg-surface-sunken",
                      current &&
                        "bg-accent-subtle font-bold text-accent before:absolute before:inset-y-2 before:start-0 before:rounded-full before:bg-accent before:inline-0.75",
                    )}
                  >
                    <Icon name={item.icon} />
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
