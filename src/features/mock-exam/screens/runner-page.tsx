import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { getMockDeck, listThemes } from "@/lib/content/repository";
import type { Mode } from "../index";
import { MockRunner } from "./mock-runner";

export async function RunnerPage({ mode }: { mode: Mode }) {
  const [deck, themes, t] = await Promise.all([getMockDeck(), listThemes(), getTranslations("mock.ready")]);
  return (
    <Suspense fallback={<h1 className="text-h1">{t(mode)}</h1>}>
      <MockRunner deck={deck} themes={themes.map(({ id, title }) => ({ id, title: title.fa }))} mode={mode} />
    </Suspense>
  );
}
