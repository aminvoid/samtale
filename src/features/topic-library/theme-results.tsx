import { useTranslations } from "next-intl";
import { IconCheck } from "@/components/ui/icon";
import { PersianText } from "@/components/ui/persian-text";
import { Link } from "@/i18n/navigation";
import type { Theme, TopicSummary } from "@/lib/content/repository";
import { cn } from "@/lib/utils/cn";
import { TopicList } from "./topic-list";

export type ThemeResultsProps = {
  theme: Pick<Theme, "id" | "subthemes">;
  topics: readonly TopicSummary[];
  selectedSubtheme?: string | null;
};

export function ThemeResults({ theme, topics, selectedSubtheme }: ThemeResultsProps) {
  const t = useTranslations("library.filter");
  const selected = theme.subthemes.find(({ id }) => id === selectedSubtheme)?.id ?? null;
  const tabs = [
    { id: null, label: t("all") },
    ...theme.subthemes.map(({ id, title }) => ({ id, label: title.fa })),
  ];
  const visible = selected === null ? topics : topics.filter((topic) => topic.subthemeId === selected);
  const path = `/topics/themes/${theme.id}`;

  return (
    <div
      className={cn(
        "mbs-6",
        theme.subthemes.length > 0 &&
          "grid gap-6 xl:grid-cols-[var(--container-library-filters)_minmax(0,var(--container-reading))]",
      )}
    >
      {theme.subthemes.length > 0 && (
        <nav aria-label={t("label")}>
          <ul className="flex flex-wrap gap-2 xl:flex-col xl:items-start">
            {tabs.map(({ id, label }) => {
              const current = id === selected;
              return (
                <li key={id ?? path}>
                  <Link
                    href={id === null ? path : { pathname: path, query: { sub: id } }}
                    scroll={false}
                    prefetch={false}
                    aria-current={current ? "true" : undefined}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-chip border px-3 py-1 text-label min-block-touch min-inline-touch",
                      current
                        ? "border-accent bg-accent text-accent-contrast"
                        : "border-border-strong hover:bg-surface-sunken",
                    )}
                  >
                    {current && <IconCheck size={16} />}
                    <PersianText className="text-label">{label}</PersianText>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
      <TopicList topics={visible} />
    </div>
  );
}
