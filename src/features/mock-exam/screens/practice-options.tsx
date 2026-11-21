import { useTranslations } from "next-intl";
import { useId } from "react";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import type { MockDeck } from "@/lib/content/repository";
import { cn } from "@/lib/utils/cn";
import type { MockExamAction, State } from "../index";
import { mockCard, type ThemeOption } from "./presentation";

export function PracticeOptions({
  context,
  deck,
  themes,
  send,
}: {
  context: State["context"];
  deck: MockDeck;
  themes: readonly ThemeOption[];
  send: (action: MockExamAction) => void;
}) {
  const t = useTranslations("mock.ready");
  const common = useTranslations("mock");
  const id = useId();
  const { topicSource, situationPolicy } = context.options;
  const eligibleThemes = themes.filter(({ id }) => deck.topics.some((topic) => topic.themeId === id));
  const firstTheme = eligibleThemes[0];
  const firstTopic = deck.topics[0];
  const label =
    topicSource.type === "chosen"
      ? deck.topics.find(({ id }) => id === topicSource.topicId)?.title.fa
      : topicSource.type === "drawFromTheme"
        ? eligibleThemes.find(({ id }) => id === topicSource.themeId)?.title
        : t("draw");
  const choice = situationPolicy === "random" ? "examinerChooses" : "learnerChooses";
  const control =
    "rounded-control border border-border-strong bg-surface-raised p-2 min-block-touch max-inline-full";
  return (
    <section className={cn(mockCard, "grid gap-2")}>
      <h2 className="text-h2">{t("options")}</h2>
      <p>{t("optionSummary", { topic: label ?? t("draw"), situation: t(choice) })}</p>
      <Sheet
        title={t("options")}
        closeLabel={common("close")}
        trigger={<Button variant="secondary">{t("change")}</Button>}
      >
        <div className="grid gap-4">
          <label className="grid gap-1">
            {t("topic")}
            <select
              className={control}
              value={topicSource.type}
              onChange={(event) => {
                const value = event.currentTarget.value;
                if (value === "chosen" && firstTopic)
                  send({
                    type: "OPTIONS_SET",
                    options: { topicSource: { type: "chosen", topicId: firstTopic.id } },
                  });
                else if (value === "drawFromTheme" && firstTheme)
                  send({
                    type: "OPTIONS_SET",
                    options: { topicSource: { type: "drawFromTheme", themeId: firstTheme.id } },
                  });
                else send({ type: "OPTIONS_SET", options: { topicSource: { type: "draw" } } });
              }}
            >
              <option value="draw">{t("draw")}</option>
              {firstTheme && <option value="drawFromTheme">{t("theme")}</option>}
              {firstTopic && <option value="chosen">{t("chosen")}</option>}
            </select>
          </label>
          {topicSource.type === "drawFromTheme" && (
            <label className="grid gap-1">
              {t("pickTheme")}
              <select
                className={control}
                value={topicSource.themeId}
                onChange={(event) => {
                  send({
                    type: "OPTIONS_SET",
                    options: { topicSource: { type: "drawFromTheme", themeId: event.currentTarget.value } },
                  });
                }}
              >
                {eligibleThemes.map((theme) => (
                  <option key={theme.id} value={theme.id}>
                    {theme.title}
                  </option>
                ))}
              </select>
            </label>
          )}
          {topicSource.type === "chosen" && (
            <label className="grid gap-1">
              {t("pickTopic")}
              <select
                className={control}
                value={topicSource.topicId}
                onChange={(event) => {
                  send({
                    type: "OPTIONS_SET",
                    options: { topicSource: { type: "chosen", topicId: event.currentTarget.value } },
                  });
                }}
              >
                {deck.topics.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.title.fa}
                  </option>
                ))}
              </select>
            </label>
          )}
          <fieldset>
            <legend className="font-semibold">{t("situation")}</legend>
            {(["random", "learnerChooses"] satisfies Array<typeof situationPolicy>).map((value) => (
              <label key={value} className="flex items-center gap-2 min-block-touch">
                <input
                  type="radio"
                  name={id}
                  checked={situationPolicy === value}
                  onChange={() => {
                    send({ type: "OPTIONS_SET", options: { situationPolicy: value } });
                  }}
                />
                {t(value === "random" ? "examinerChooses" : "learnerChooses")}
              </label>
            ))}
          </fieldset>
        </div>
      </Sheet>
    </section>
  );
}
