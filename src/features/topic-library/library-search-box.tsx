"use client";

import { useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { useCallback, useEffect, useState } from "react";
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
  const [draft, setDraft] = useState(query);
  const [submitted, setSubmitted] = useState<string | null>(null);

  if (location.pathname !== pathname || location.query !== query) {
    setLocation({ pathname, query });
    // Keep typing in the same field while the first search navigation is in flight.
    if (query !== submitted || !onSearchPage) setDraft(query);
    setSubmitted(null);
  }

  const commit = useCallback(
    (value: string) => {
      if (value === query || submitted !== null) return;
      const href = value ? { pathname: searchPath, query: { q: value } } : searchPath;
      setSubmitted(value);
      if (onSearchPage) {
        window.history.replaceState(null, "", getPathname({ href, locale }));
      } else {
        router.push(href, { scroll: false });
      }
    },
    [locale, onSearchPage, query, router, submitted],
  );

  useEffect(() => {
    const value = draft.trim();
    if (value === query || submitted !== null) return;
    const timer = window.setTimeout(() => {
      commit(value);
    }, searchDelayMs);
    return () => {
      window.clearTimeout(timer);
    };
  }, [commit, draft, query, submitted]);

  return (
    <SearchField
      action={getPathname({ href: searchPath, locale })}
      value={draft}
      onChange={setDraft}
      onClear={() => {
        setDraft("");
        commit("");
      }}
      onSubmit={(event) => {
        event.preventDefault();
        commit(draft.trim());
      }}
    />
  );
}
