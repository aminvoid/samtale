import { useTranslations } from "next-intl";
import { Disclosure } from "@/components/ui/disclosure";
import { IconCircleHelp } from "@/components/ui/icon";
import { InfoNote } from "@/components/ui/info-note";
import { Link } from "@/i18n/navigation";

export function ListInfoButton() {
  const t = useTranslations("library");
  const nav = useTranslations("nav");

  return (
    <Disclosure label={t("olderInfo")} icon={<IconCircleHelp />} className="mbs-1">
      <InfoNote>
        <p>{t("olderExplanation")}</p>
        <Link
          href="/guide/delproeve-2"
          className="inline-flex items-center rounded-control text-accent underline min-block-touch min-inline-touch"
        >
          {nav("guide")}
        </Link>
      </InfoNote>
    </Disclosure>
  );
}
