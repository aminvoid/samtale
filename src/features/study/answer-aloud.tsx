"use client";

import { useTranslations } from "next-intl";
import {
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { Button } from "@/components/ui/button";
import { IconMic } from "@/components/ui/icon";
import { useAudioPlayer } from "@/lib/audio/player";
import { onHistoryBack } from "@/lib/navigation/history-back";
import { AnswerAloudPanel, type SpeakingQuestion } from "./answer-aloud-panel";
import { createAnswerAloudSession } from "./answer-aloud-session";

const OpenExercise = createContext<((itemId: string, trigger: HTMLButtonElement) => void) | null>(null);
const historyKey = "pd3AnswerAloud";

export function AnswerAloudProvider({
  topicId,
  questions,
  children,
}: {
  topicId: string;
  questions: readonly SpeakingQuestion[];
  children: ReactNode;
}) {
  const player = useAudioPlayer();
  const [session] = useState(() => createAnswerAloudSession(topicId, player));
  const state = useSyncExternalStore(session.subscribe, session.getSnapshot, session.getServerSnapshot);
  const trigger = useRef<HTMLButtonElement>(null);
  const historyToken = useRef<string | null>(null);

  useLayoutEffect(() => {
    function discard() {
      historyToken.current = null;
      session.close();
    }

    const offBack = onHistoryBack(discard);
    const onVisibility = () => {
      if (document.visibilityState === "hidden") session.interrupt();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", discard);
    return () => {
      offBack();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", discard);
      discard();
    };
  }, [session]);

  function start(question: SpeakingQuestion) {
    session.start(question.id, question.audio && { id: question.id, ...question.audio });
  }

  function open(itemId: string, button: HTMLButtonElement) {
    const question = questions.find(({ id }) => id === itemId);
    if (question === undefined || historyToken.current !== null || session.getSnapshot().phase !== "closed")
      return;
    trigger.current = button;
    // A same-page entry makes the browser Back gesture close the panel without leaving the topic.
    try {
      const token = crypto.getRandomValues(new Uint32Array(4)).join("-");
      const current: unknown = window.history.state;
      window.history.pushState({ ...(typeof current === "object" ? current : {}), [historyKey]: token }, "");
      historyToken.current = token;
    } catch {
      // The exercise still opens when the browser restricts history writes.
    }
    start(question);
  }

  function close() {
    session.close();
    const current: unknown = window.history.state;
    if (
      historyToken.current !== null &&
      typeof current === "object" &&
      current !== null &&
      historyKey in current &&
      current[historyKey] === historyToken.current
    ) {
      window.history.back();
    } else {
      historyToken.current = null;
    }
  }

  const index = questions.findIndex(({ id }) => id === state.itemId);
  const question = questions[index];
  const next = questions[index + 1];

  return (
    <OpenExercise value={open}>
      {children}
      <AnswerAloudPanel
        question={question}
        state={state}
        session={session}
        trigger={trigger}
        close={close}
        next={
          next === undefined
            ? undefined
            : () => {
                start(next);
              }
        }
      />
    </OpenExercise>
  );
}

export function AnswerAloud({ itemId, primary = false }: { itemId: string; primary?: boolean }) {
  const t = useTranslations("study");
  const open = useContext(OpenExercise);
  if (open === null) throw new Error("AnswerAloud requires AnswerAloudProvider");

  return (
    <div className="grid content-start gap-2">
      <Button
        variant={primary ? "primary" : "secondary"}
        size={primary ? "lg" : "md"}
        className={primary ? "xl:min-block-touch" : "justify-self-start"}
        icon={<IconMic />}
        onClick={(event) => {
          open(itemId, event.currentTarget);
        }}
      >
        {t("answerAloud")}
      </Button>
      {primary && <p className="text-caption text-text-muted">{t("answerAloudTip")}</p>}
    </div>
  );
}
