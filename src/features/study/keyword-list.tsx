import { useTranslations } from "next-intl";
import { DanishText } from "@/components/ui/danish-text";
import { PersianText } from "@/components/ui/persian-text";
import { RoleHeader } from "@/components/ui/role-header";
import { Link } from "@/i18n/navigation";
import type { Topic } from "@/lib/content/repository";
import { StudyClipButton } from "./study-clip-button";

export function KeywordList({
  keywords,
  template,
}: {
  keywords: Topic["general"]["question"]["keywords"];
  template: 1 | 2;
}) {
  const t = useTranslations("study");
  if (keywords.length === 0) return null;

  return (
    <div className="grid gap-2 rounded-card bg-role-keyword-subtle p-4">
      <RoleHeader as="h3" role="keywords" label={t("keywords")} />
      <ul role="list">
        {keywords.map((keyword, index) => (
          <li
            key={keyword.id}
            className="flex items-start gap-2 border-be border-role-keyword/20 py-2 last:border-be-0"
          >
            <span aria-hidden className="grid shrink-0 place-items-center block-7 inline-7">
              {keyword.emoji}
            </span>
            <span className="grid grow gap-1 min-inline-0">
              <DanishText className="text-align-flow text-da-keyword wrap-anywhere">
                {keyword.text.da}
              </DanishText>
              <PersianText className="text-ui wrap-anywhere text-text-muted">{keyword.text.fa}</PersianText>
            </span>
            <StudyClipButton
              item={{ id: keyword.id, audio: keyword.audio }}
              label={t("playKeyword", { position: index + 1 })}
              variant="neutral"
            />
          </li>
        ))}
      </ul>
      <p className="text-caption text-text-muted">
        {t.rich("keywordsTip", {
          number: template,
          template: (text) => (
            <Link
              href="/templates"
              className="inline-flex items-center text-accent underline min-block-touch"
            >
              {text}
            </Link>
          ),
        })}
      </p>
    </div>
  );
}
