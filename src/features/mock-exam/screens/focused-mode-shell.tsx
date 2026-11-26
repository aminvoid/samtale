import { useTranslations } from "next-intl";
import { useLayoutEffect, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { IconLogOut } from "@/components/ui/icon";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils/cn";
import type { MockExamAction, Mode } from "../index";
import { mockLink, mockTextLink } from "./presentation";

export function FocusedModeShell({
  mode,
  send,
  children,
  tools,
  indicator,
  answerArea,
  finished = false,
  closing = false,
  onClose,
}: {
  mode: Mode;
  send: (action: MockExamAction) => void;
  children: ReactNode;
  tools?: ReactNode;
  indicator?: ReactNode;
  answerArea?: ReactNode;
  finished?: boolean;
  closing?: boolean;
  /** Replaces the plain Close link on the end view, e.g. to warn before recordings are discarded. */
  onClose?: () => void;
}) {
  const t = useTranslations("mock");
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.dataset.mockFocused = "";
    return () => {
      delete root.dataset.mockFocused;
    };
  }, []);

  return (
    <div className="flex flex-col min-block-dvh">
      <header
        data-sticky="focused-header"
        className="sticky inset-bs-0 z-30 border-be border-border bg-surface-raised data-[pinned=false]:static short:static"
      >
        <div className="mx-auto grid gap-1 px-4 py-2 max-inline-page md:px-6">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            {finished && onClose ? (
              <Button variant="tertiary" onClick={onClose}>
                {t("close")}
              </Button>
            ) : finished ? (
              <Link className={cn(mockLink, mockTextLink)} href="/mock">
                {t("close")}
              </Link>
            ) : (
              <Button
                variant="tertiary"
                icon={<IconLogOut />}
                disabled={closing}
                onClick={() => {
                  send({ type: "LEAVE_REQUESTED" });
                }}
              >
                {t("leave")}
              </Button>
            )}
            <span className="rounded-chip border border-border bg-surface px-3 py-1 text-caption font-semibold">
              {t(`mode.${mode}`)}
            </span>
            {tools}
          </div>
          {indicator}
        </div>
      </header>
      <div className="mx-auto grid grow content-start gap-4 px-4 py-4 inline-full max-inline-180 md:gap-5 md:px-6 md:py-6">
        {children}
      </div>
      {answerArea && (
        <div
          data-sticky="answer-area"
          className="sticky inset-be-0 z-20 border-bs border-border bg-surface-raised shadow-raised data-[pinned=false]:static md:static md:border-transparent md:bg-surface md:shadow-none short:static"
        >
          <div className="mx-auto grid gap-2 px-4 pbs-3 pbe-[max(--spacing(3),env(safe-area-inset-bottom))] inline-full max-inline-180 md:px-6 md:pbe-6">
            {answerArea}
          </div>
        </div>
      )}
    </div>
  );
}
