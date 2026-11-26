import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/card";
import { DanishText } from "@/components/ui/danish-text";
import {
  IconChevronRight,
  IconLibraryBig,
  IconLightbulb,
  IconMessagesSquare,
  IconSignpost,
} from "@/components/ui/icon";
import { InfoNote } from "@/components/ui/info-note";
import { PageHeader } from "@/components/ui/page-header";
import { Link } from "@/i18n/navigation";
import { richTags } from "@/i18n/rich-tags";
import { examConfig } from "@/lib/exam/config";

export async function HomeScreen({ topicCount }: { topicCount: number }) {
  const [t, nav, metadata] = await Promise.all([
    getTranslations("home"),
    getTranslations("nav"),
    getTranslations("metadata"),
  ]);

  const startingPoints = [
    {
      href: "/topics",
      title: t("topics"),
      hint: t("topicCount", { count: topicCount }),
      icon: <IconLibraryBig size={24} />,
    },
    {
      href: "/mock",
      title: t("mock"),
      hint: t("mockHint"),
      icon: <IconMessagesSquare size={24} />,
    },
  ];

  return (
    <>
      <div className="grid grid-cols-1 gap-3 md:mx-auto md:max-inline-reading xl:mx-0 xl:grid-cols-12 xl:gap-8 xl:max-inline-none">
        <div className="xl:col-span-7">
          <PageHeader
            title={<DanishText as="bdi">{metadata("appName")}</DanishText>}
            subtitle={<p className="text-label">{t.rich("descriptor", richTags)}</p>}
          />
          <p className="mbs-4 text-lead">{t.rich("purpose", { ...richTags, part: "2" })}</p>
          <p className="text-body text-text-muted">{t("partGloss")}</p>
          <div className="mbs-3 text-caption text-text-muted">
            <p>
              {t("source", { start: 2016, end: 2024 })} {t.rich("independent", richTags)}
            </p>
            <Link
              href="/about"
              className="inline-flex items-center gap-1 rounded-control text-accent underline min-block-touch"
            >
              {nav("about")}
              <IconChevronRight size={16} />
            </Link>
          </div>
          <Card
            href="/guide/delproeve-2"
            className="mbs-3 flex items-center gap-3 border-accent bg-accent text-accent-contrast hover:border-accent-hover hover:bg-accent-hover active:bg-accent-active"
          >
            <span className="grid shrink-0 place-items-center rounded-control bg-surface-raised text-accent block-10 inline-10">
              <IconSignpost size={24} />
            </span>
            <span className="grow wrap-anywhere min-inline-0">
              <span className="block text-h3">{t.rich("guide", { ...richTags, part: "2" })}</span>
              <span className="block text-caption">{t("guideHint", { minutes: 3 })}</span>
            </span>
            <IconChevronRight />
          </Card>
        </div>
        <ul className="grid grid-cols-1 content-start gap-3 md:grid-cols-2 xl:col-span-5 xl:grid-cols-1">
          {startingPoints.map(({ href, title, hint, icon }) => (
            <li key={href}>
              <Card href={href} className="flex items-center gap-3 block-full">
                <span className="grid shrink-0 place-items-center rounded-control bg-accent-subtle text-accent block-10 inline-10">
                  {icon}
                </span>
                <span className="grow wrap-anywhere min-inline-0">
                  <span className="block text-h3">{title}</span>
                  <span className="block text-caption text-text-muted">{hint}</span>
                </span>
                <IconChevronRight className="text-text-muted" />
              </Card>
            </li>
          ))}
        </ul>
      </div>
      <InfoNote icon={IconLightbulb} className="mx-auto mbs-6 max-inline-reading xl:mx-0">
        <h2 className="text-h3">{t("tipTitle")}</h2>
        <p>{t.rich("firstQuestionTip", richTags)}</p>
        <p className="mbs-2">{t("repeatLabel")}</p>
        <DanishText as="p" className="text-align-flow text-da-card">
          {examConfig.repeatRequestText}
        </DanishText>
      </InfoNote>
    </>
  );
}
