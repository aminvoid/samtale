import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { DanishText } from "@/components/ui/danish-text";
import { Icon } from "@/components/ui/icon";
import { PersianText } from "@/components/ui/persian-text";
import { TermName } from "@/components/ui/term-name";
import { Link } from "@/i18n/navigation";
import type { TopicLink, TopicSummary } from "@/lib/content/repository";

export type StudyDestination = { link: TopicLink; topic: TopicSummary };

export function StudyTopicLink({ destination }: { destination: StudyDestination }) {
  const t = useTranslations("study");
  const { link, topic } = destination;
  const href = {
    pathname: `/topics/${topic.id}`,
    hash: link.toSection ?? undefined,
  };

  if (link.kind === "related") {
    return (
      <Card href={href} prefetch={false} className="flex items-center gap-3">
        <span className="grid grow gap-1 min-inline-0">
          <DanishText className="text-align-flow text-da-card wrap-anywhere">{topic.title.da}</DanishText>
          <PersianText className="text-ui wrap-anywhere text-text-muted">{topic.title.fa}</PersianText>
        </span>
        <Icon name="chevron-right" className="shrink-0 text-text-muted" />
      </Card>
    );
  }

  const term = () => <TermName term={topic.term} letter={topic.letter} />;
  const section = link.toSection;
  const label =
    section === null
      ? t.rich("similar", { term })
      : t.rich("similarSection", {
          term,
          section: () =>
            section === "general"
              ? t("general")
              : t.rich(section, {
                  letter: () => <DanishText as="bdi">{section === "sitA" ? "A" : "B"}</DanishText>,
                }),
        });

  return (
    <Link
      href={href}
      prefetch={false}
      className="flex items-center gap-2 rounded-control px-2 py-1 text-caption text-accent min-block-touch hover:bg-accent-subtle"
    >
      <Icon name="layers" size={16} className="shrink-0" />
      <span>{label}</span>
    </Link>
  );
}
