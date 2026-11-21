"use client";

import { useLocale, useTranslations } from "next-intl";
import { Suspense } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { getPathname, Link, usePathname } from "@/i18n/navigation";
import { richTags } from "@/i18n/rich-tags";
import { cn } from "@/lib/utils/cn";
import { LibrarySearchBox } from "./library-search-box";
import { searchPath, similarPath, termsPath, themesPath } from "./library-paths";
import { SearchField } from "./search-field";

const views = [
  { href: themesPath, label: "view.themes" },
  { href: termsPath, label: "view.terms" },
  { href: similarPath, label: "view.similar" },
] satisfies { href: string; label: "view.themes" | "view.terms" | "view.similar" }[];

export function LibraryHeader() {
  const t = useTranslations("library");
  const locale = useLocale();
  const pathname = usePathname();
  const title = pathname === similarPath ? t("similar.title") : t.rich("title", { ...richTags, part: "2" });

  return (
    <div className="mbe-6">
      <PageHeader title={title} subtitle={t("subtitle", { start: 2016, end: 2024 })} />
      <div className="mbs-4 grid gap-4 xl:grid-cols-[minmax(0,var(--container-library-search))_1fr] xl:items-end">
        <Suspense fallback={<SearchField action={getPathname({ href: searchPath, locale })} />}>
          <LibrarySearchBox pathname={pathname} />
        </Suspense>
        <nav aria-label={t("views")} data-keep-focus>
          <ul className="flex flex-wrap gap-1 rounded-control bg-surface-sunken p-1">
            {views.map(({ href, label }) => {
              const current = pathname === href;
              return (
                <li key={href} className="flex flex-1">
                  <Link
                    href={href}
                    aria-current={current ? "page" : undefined}
                    className={cn(
                      "relative flex flex-1 items-center justify-center rounded-control px-0.5 py-1 text-center text-label min-block-touch",
                      current
                        ? "bg-surface-raised font-bold shadow-card after:absolute after:inset-x-2 after:inset-be-0 after:rounded-full after:bg-accent after:block-0.75"
                        : "text-text-muted hover:text-text",
                    )}
                  >
                    {t(label)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}
