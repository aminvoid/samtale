import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/ui/page-header";

export async function ComingSoon({ title, subtitle }: { title: ReactNode; subtitle?: ReactNode }) {
  const t = await getTranslations("common");
  return (
    <>
      <PageHeader title={title} subtitle={subtitle} />
      <p className="mbs-4 text-body text-text-muted">{t("comingSoon")}</p>
    </>
  );
}
