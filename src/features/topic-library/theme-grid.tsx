import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/card";
import { DanishText } from "@/components/ui/danish-text";
import { Icon } from "@/components/ui/icon";
import { PersianText } from "@/components/ui/persian-text";
import { ThemeIcon } from "@/components/ui/theme-icon";
import type { ThemeSummary } from "@/lib/content/repository";

export async function ThemeGrid({ themes }: { themes: readonly ThemeSummary[] }) {
  const t = await getTranslations("library");
  if (themes.length === 0) return <p className="text-body text-text-muted">{t("empty")}</p>;

  return (
    <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 xl:gap-6">
      {themes.map((theme) => (
        <li key={theme.id}>
          <Card
            href={`/topics/themes/${theme.id}`}
            className="flex items-center gap-3 block-full min-block-24"
          >
            <div className="flex grow flex-col min-inline-0">
              <DanishText
                as="p"
                className="order-2 text-align-flow text-da-intro wrap-anywhere text-text-muted"
              >
                {theme.title.da}
              </DanishText>
              <PersianText as="p" className="order-1 text-h3">
                {theme.title.fa}
              </PersianText>
              <p className="order-3 text-caption text-text-muted">
                {t("topicCount", { count: theme.topicCount })}
              </p>
            </div>
            <span className="order-first grid shrink-0 place-items-center rounded-control bg-accent-subtle text-accent block-10 inline-10">
              <ThemeIcon themeId={theme.id} size={24} />
            </span>
            <Icon name="chevron-right" className="text-text-muted" />
          </Card>
        </li>
      ))}
    </ul>
  );
}
