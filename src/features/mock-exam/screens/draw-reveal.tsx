import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DanishText } from "@/components/ui/danish-text";
import { FocusHeading } from "@/components/ui/focus-heading";
import { InfoNote } from "@/components/ui/info-note";
import { Pre2023Badge } from "@/components/ui/pre2023-badge";
import { TermName } from "@/components/ui/term-name";
import type { PreloadProgress } from "@/lib/audio/preload";
import type { MockDeck } from "@/lib/content/repository";
import { cn } from "@/lib/utils/cn";
import type { MockExamAction, State } from "../index";
import { FocusedModeShell } from "./focused-mode-shell";
import { mockCard } from "./presentation";
import { PrimaryAction } from "./primary-action";

export function DrawReveal({
  state,
  send,
  deck,
  preloadProgress,
}: {
  state: Extract<State, { type: "prepare.draw" | "prepare.reveal" }>;
  send: (action: MockExamAction) => void;
  deck: MockDeck;
  preloadProgress: PreloadProgress | null;
}) {
  const t = useTranslations("mock");
  const error = useTranslations("error");
  const library = useTranslations("library");
  const [draw, setDraw] = useState<{ index: number; count: number }>();
  const faceDown = "rounded-card border-2 border-role-examiner bg-role-examiner-subtle shadow-card";
  const topic =
    state.type === "prepare.reveal"
      ? deck.topics.find(({ id }) => id === state.context.topic?.id)
      : undefined;
  return (
    <FocusedModeShell
      mode={state.context.mode}
      send={send}
      answerArea={
        state.type === "prepare.reveal" && (
          <>
            <p className="text-caption text-text-muted">
              {t(state.context.mode === "exam" ? "reveal.clockExam" : "reveal.clockPractice")}
            </p>
            <PrimaryAction
              label={t("reveal.start")}
              describedBy={state.status === "loaded" ? undefined : "mock-preload-status"}
              onClick={
                state.status === "loaded"
                  ? () => {
                      send({ type: "START" });
                    }
                  : undefined
              }
            />
          </>
        )
      }
    >
      {state.type === "prepare.draw" ? (
        <>
          <FocusHeading key="draw">{t("draw.title")}</FocusHeading>
          <p className="text-lead text-text-muted">{t("draw.hint")}</p>
          <div className="grid auto-cols-fr grid-flow-col gap-3 md:gap-5">
            {state.cards.map((card, index) => (
              <button
                key={card.id}
                type="button"
                aria-label={t("draw.card", { number: index + 1, total: state.cards.length })}
                className={cn(
                  faceDown,
                  "aspect-[3/4] hover:bg-surface-raised motion-safe:transition-transform motion-safe:duration-(--duration-fast) motion-safe:hover:-translate-y-1",
                )}
                onClick={() => {
                  setDraw({ index, count: state.cards.length });
                  send({ type: "CARD_TAPPED", index });
                }}
              />
            ))}
          </div>
        </>
      ) : (
        topic && (
          <>
            {draw && (
              <div className="grid auto-cols-fr grid-flow-col gap-3">
                {Array.from({ length: draw.count }, (_, index) => (
                  <button
                    key={index}
                    type="button"
                    disabled
                    aria-label={t("draw.card", { number: index + 1, total: draw.count })}
                    className={cn(
                      faceDown,
                      "min-block-touch",
                      index === draw.index ? "border-accent bg-accent-subtle" : "opacity-60",
                    )}
                  />
                ))}
              </div>
            )}
            <div
              className={cn(
                mockCard,
                "grid gap-2 border-role-examiner bg-role-examiner-subtle motion-safe:animate-fade-in",
              )}
            >
              <FocusHeading key={topic.id}>
                <DanishText as="bdi" className="block text-display">
                  {topic.letter}
                </DanishText>
                <DanishText as="bdi" className="wrap-anywhere">
                  {topic.title.da}
                </DanishText>
              </FocusHeading>
              <p className="text-lead">{topic.title.fa}</p>
              <div className="flex flex-wrap items-center gap-2">
                <TermName term={topic.term} letter={topic.letter} variant="chip" />
                {topic.formatEraId === "pre-2023" && (
                  <Pre2023Badge
                    variant="explained"
                    explanationLabel={library("olderInfo")}
                    explanation={library("olderExplanation")}
                  >
                    {library("olderShort")}
                  </Pre2023Badge>
                )}
              </div>
            </div>
            {draw && <InfoNote variant="compact">{t("reveal.letter")}</InfoNote>}
            {state.status !== "loaded" && (
              <div className="grid gap-2" id="mock-preload-status">
                <p role="status" aria-live="polite">
                  {t(state.status === "loading" ? "reveal.loading" : `reveal.${state.status}`)}
                </p>
                {state.status !== "failed" && (
                  <>
                    <progress
                      className="accent-accent inline-full"
                      aria-label={t("reveal.loading")}
                      value={preloadProgress?.loaded}
                      max={preloadProgress?.total || undefined}
                    />
                    <p className="text-caption text-text-muted">{t("reveal.data", { size: 1 })}</p>
                  </>
                )}
                {state.status !== "loading" && (
                  <Button
                    className="justify-self-start"
                    variant="secondary"
                    onClick={() => {
                      send({ type: "RETRY_LOAD" });
                    }}
                  >
                    {error("retry")}
                  </Button>
                )}
              </div>
            )}
          </>
        )
      )}
    </FocusedModeShell>
  );
}
