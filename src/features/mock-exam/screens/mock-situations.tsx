import { useTranslations } from "next-intl";
import { DanishText } from "@/components/ui/danish-text";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils/cn";
import type { State } from "../index";
import type { DeckTopic } from "./presentation";

export function MockSituations({
  topic,
  selected,
  compact,
  translated,
}: {
  topic: DeckTopic;
  selected: State["context"]["situationKey"];
  compact: boolean;
  translated: boolean;
}) {
  const t = useTranslations("mock.look");
  return (
    <ul className={cn("grid gap-2", compact ? "grid-cols-2" : "sm:grid-cols-2")}>
      {topic.situations.map((situation) => {
        const chosen = situation.key === selected;
        return (
          <li
            key={situation.key}
            data-selected={chosen || undefined}
            className={cn(
              "grid content-start gap-1 rounded-card border bg-surface-raised p-2 min-inline-0",
              chosen && "border-2 border-accent bg-accent-subtle",
              !chosen && (selected === null ? "border-border" : "border-dashed border-border-strong"),
            )}
          >
            <div className="flex flex-wrap items-center gap-2 text-caption font-semibold">
              <DanishText as="bdi" className="rounded-chip bg-surface-sunken px-2">
                {situation.key}
              </DanishText>
              {chosen ? (
                <span>{t("chosen")}</span>
              ) : (
                <Icon name="layers" size={16} className="text-text-muted" />
              )}
            </div>
            <DanishText as="p" className={cn("wrap-anywhere", compact ? "text-da-label" : "text-da-line")}>
              {situation.title.da}
            </DanishText>
            {translated && (
              <p lang="fa" className="text-caption">
                {situation.title.fa}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
