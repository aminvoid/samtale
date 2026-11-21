"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ShareTopic() {
  const t = useTranslations("study");
  const [result, setResult] = useState<"copied" | "failed">();

  async function share() {
    try {
      const url = new URL(window.location.href);
      if (url.hash.startsWith("#answer-")) url.hash = "";
      await navigator.clipboard.writeText(url.href);
      setResult("copied");
    } catch {
      setResult("failed");
    }
  }

  return (
    <div>
      <Button variant="secondary" icon="share-2" onClick={() => void share()}>
        {t("share")}
      </Button>
      <p className="text-caption text-text-muted" role="status">
        {result === undefined ? null : t(result === "copied" ? "shareCopied" : "shareFailed")}
      </p>
    </div>
  );
}
