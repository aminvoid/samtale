import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { DanishText } from "@/components/ui/danish-text";
import { Icon } from "@/components/ui/icon";
import { Link } from "@/i18n/navigation";
import { richTags } from "@/i18n/rich-tags";
import { MenuDrawer } from "./menu-drawer";
import { PrimaryNavigation } from "./primary-navigation";
import { ShellEffects } from "./shell-effects";

export async function AppShell({ children }: { children: ReactNode }) {
  const [t, metadata] = await Promise.all([getTranslations("nav"), getTranslations("metadata")]);

  return (
    <div className="flex flex-col min-block-dvh">
      <header data-app-chrome className="border-be border-border bg-surface">
        <div className="mx-auto flex items-center justify-between gap-3 px-4 max-inline-page min-block-touch-primary md:px-6 xl:px-8">
          <Link
            href="/"
            className="inline-flex shrink-0 items-center gap-2 rounded-control text-h3 min-block-touch"
          >
            <span className="grid place-items-center rounded-control bg-accent text-accent-contrast block-7 inline-7">
              <Icon name="messages-square" size={16} />
            </span>
            <DanishText as="bdi">{metadata("appName")}</DanishText>
          </Link>
          <PrimaryNavigation variant="top" />
          <MenuDrawer />
        </div>
      </header>
      <main
        id="main"
        tabIndex={-1}
        className="mx-auto grow px-4 pbs-6 pbe-8 inline-full max-inline-page md:px-6 xl:px-8"
      >
        {children}
      </main>
      <footer data-app-chrome className="bg-surface-sunken pbe-8 text-caption text-text-muted">
        <div className="mx-auto px-4 pbs-4 max-inline-page md:px-6 xl:px-8">
          <nav aria-label={t("footer")} className="flex flex-wrap gap-x-4">
            <Link href="/about" className="inline-flex items-center text-accent underline min-block-touch">
              {t("about")}
            </Link>
            <Link href="/privacy" className="inline-flex items-center text-accent underline min-block-touch">
              {t("privacy")}
            </Link>
          </nav>
          <p>{t.rich("siriCredit", richTags)}</p>
          <p>{t("bookletCredit")}</p>
        </div>
      </footer>
      <div
        aria-hidden
        data-app-chrome
        className="block-[var(--bottom-offset,calc(var(--spacing-tabbar)+env(safe-area-inset-bottom)))] md:hidden short:hidden"
      />
      <PrimaryNavigation variant="bottom" />
      <ShellEffects />
    </div>
  );
}
