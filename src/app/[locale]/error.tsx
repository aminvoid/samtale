"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { reportError } from "@/lib/observability/report-error";

/** `retry` re-fetches and re-renders the segment (stable since Next 16.3); `error` may not be an Error. */
export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  const t = useTranslations("error");
  const title = t("title");
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    reportError(error, { area: "route" });
  }, [error]);

  // Screen-reader users land on the message instead of wherever focus was.
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;
    headingRef.current?.focus();
    return () => {
      if (document.title === title) document.title = previousTitle;
    };
  }, [title]);

  return (
    <div className="mx-auto max-inline-reading">
      <h1 ref={headingRef} tabIndex={-1} className="text-h1">
        {title}
      </h1>
      <div className="mbs-6 flex flex-col items-start gap-2">
        <Button
          icon="rotate-ccw"
          onClick={retry}
          className="inline-full min-block-touch-primary md:inline-auto md:min-block-touch"
        >
          {t("retry")}
        </Button>
        <Link
          href="/"
          className="inline-flex items-center text-accent underline min-block-touch min-inline-touch"
        >
          {t("backHome")}
        </Link>
      </div>
    </div>
  );
}
