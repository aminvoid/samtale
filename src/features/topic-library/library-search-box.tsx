"use client";

import { useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { useEffect, useEffectEvent, useState, useTransition } from "react";
import { getPathname, useRouter } from "@/i18n/navigation";
import { searchPath } from "./library-paths";
import { SearchField } from "./search-field";

const searchDelayMs = 300;

export function LibrarySearchBox({ pathname }: { pathname: string }) {
  const params = useSearchParams();
  const locale = useLocale();
  const router = useRouter();
  const onSearchPage = pathname === searchPath;
  const query = onSearchPage ? (params.get("q") ?? "") : "";
  const [location, setLocation] = useState({ pathname, query });
  const [{ draft, edited }, setInput] = useState({ draft: query, edited: false });
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (location.pathname !== pathname || location.query !== query) {
    setLocation({ pathname, query });
    // A committed search may have newer typing waiting for its debounce.
    if (query !== submitted || !onSearchPage) setInput({ draft: query, edited: false });
    setSubmitted(null);
  } else if (submitted !== null && !pending) {
    // An interrupted transition can finish without changing the URL.
    setSubmitted(null);
  }

  function commit(value: string) {
    if (value === submitted || (value === query && submitted === null)) return;
    const href = value ? { pathname: searchPath, query: { q: value } } : searchPath;
    setSubmitted(value);
    startTransition(() => {
      if (onSearchPage) {
        window.history.replaceState(null, "", getPathname({ href, locale }));
      } else {
        router.push(href, { scroll: false });
      }
    });
  }

  const commitAfterPause = useEffectEvent(commit);
  useEffect(() => {
    if (!edited) return;
    const timer = window.setTimeout(() => {
      commitAfterPause(draft.trim());
    }, searchDelayMs);
    return () => {
      window.clearTimeout(timer);
    };
  }, [draft, edited]);

  return (
    <SearchField
      action={getPathname({ href: searchPath, locale })}
      value={draft}
      onChange={(value) => {
        setInput({ draft: value, edited: true });
      }}
      onClear={() => {
        setInput({ draft: "", edited: false });
        commit("");
      }}
      onSubmit={(event) => {
        event.preventDefault();
        setInput({ draft, edited: false });
        commit(draft.trim());
      }}
    />
  );
}
