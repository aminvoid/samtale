import { useTranslations } from "next-intl";
import { DanishText } from "@/components/ui/danish-text";
import { SourceLabel } from "@/components/ui/source-label";
import { richTags } from "@/i18n/rich-tags";
import { sourceEditionYear } from "./exam-facts";

const types = ["clarify", "elaborate", "justify", "takePosition"] satisfies (
  "clarify" | "elaborate" | "justify" | "takePosition"
)[];

export function FollowUpTypes() {
  const t = useTranslations("guide");

  // ABOUT §3.3: the examples are printed for part one. §4.1: these skills are assessed in part two.
  return (
    <section aria-labelledby="follow-up-types" className="flex flex-col gap-3">
      <h2 id="follow-up-types" tabIndex={-1} className="text-h2">
        {t("section.followUps")}
      </h2>
      <p>{t("followUps.intro")}</p>
      <ul role="list" className="grid gap-3 md:grid-cols-2">
        {types.map((type) => (
          <li
            key={type}
            className="flex flex-col gap-2 rounded-card border border-border bg-surface-raised p-4 min-inline-0"
          >
            <h3 className="text-h3">{t(`followUps.${type}.title`)}</h3>
            <div className="text-da-label">{t.rich(`followUps.${type}.term`, richTags)}</div>
            <p>{t(`followUps.${type}.body`)}</p>
            <div className="mbs-auto rounded-control bg-role-examiner-subtle p-3">
              {t.rich(`followUps.${type}.example`, {
                da: (children) => (
                  <DanishText as="p" className="text-da-followup">
                    {children}
                  </DanishText>
                ),
              })}
              <p lang="fa" className="mbs-2 text-ui">
                {t("lines.translation", { meaning: t(`followUps.${type}.meaning`) })}
              </p>
            </div>
          </li>
        ))}
      </ul>
      <div>
        <SourceLabel variant="siri">
          {t.rich("followUps.source", { ...richTags, year: sourceEditionYear })}
        </SourceLabel>
      </div>
    </section>
  );
}
