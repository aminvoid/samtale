import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { DanishText } from "@/components/ui/danish-text";
import { Icon } from "@/components/ui/icon";
import { PersianText } from "@/components/ui/persian-text";
import { Pre2023Badge } from "@/components/ui/pre2023-badge";
import type { TopicSummary } from "@/lib/content/repository";
import { cn } from "@/lib/utils/cn";
import { topicHref } from "./library-paths";
import { PracticeStatus } from "./practice-status";
import { TermName } from "@/components/ui/term-name";

type TopicListItemProps = {
  topic: TopicSummary;
  groupedByTerm?: boolean;
};

export function TopicListItem({ topic, groupedByTerm }: TopicListItemProps) {
  const t = useTranslations("library");
  return (
    <Card
      href={topicHref(topic.id)}
      prefetch={false}
      className={cn("flex items-center gap-3", groupedByTerm && "block-full")}
    >
      <span className="grow min-inline-0">
        <DanishText className="block text-align-flow text-da-card wrap-anywhere">{topic.title.da}</DanishText>
        <PersianText className="mbs-0.5 block text-ui text-text-muted">{topic.title.fa}</PersianText>
        {groupedByTerm ? (
          <PracticeStatus topicId={topic.id} />
        ) : (
          <span className="mbs-2 flex flex-wrap items-center gap-2">
            <TermName term={topic.term} letter={topic.letter} />
            {topic.formatEraId === "pre-2023" && <Pre2023Badge>{t("olderShort")}</Pre2023Badge>}
            <PracticeStatus topicId={topic.id} />
          </span>
        )}
      </span>
      {groupedByTerm && (
        <DanishText className="order-first grid shrink-0 place-items-center rounded-control bg-surface-sunken text-da-label block-8 inline-8">
          {topic.letter}
        </DanishText>
      )}
      <Icon name="chevron-right" className="text-text-muted" />
    </Card>
  );
}
