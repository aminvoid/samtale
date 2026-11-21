"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils/cn";

type StudyAnchor = "sitA" | "sitB" | "general" | "related";
type NavEntry = { id: StudyAnchor; label: ReactNode; compactLabel?: ReactNode };

function focusSection(heading: HTMLElement) {
  heading.scrollIntoView({ block: "start", behavior: "instant" });
  heading.focus({ preventScroll: true });
}

export function StudySectionNav({ entries, mockHref }: { entries: NavEntry[]; mockHref: string }) {
  const t = useTranslations("study");
  const mobileNav = useRef<HTMLElement>(null);
  const [current, setCurrent] = useState<StudyAnchor>("sitA");

  useEffect(() => {
    const root = mobileNav.current?.closest("[data-study-topic]");
    if (root == null) return;
    const headings = entries.flatMap(({ id }) => {
      const element = root.querySelector<HTMLElement>(`#${id}`);
      return element === null ? [] : [{ id, element }];
    });
    let scrollFrame = 0;
    let focusFrame = 0;

    function trackSection() {
      if (scrollFrame !== 0) return;
      scrollFrame = requestAnimationFrame(() => {
        scrollFrame = 0;
        const navEnd = mobileNav.current?.getBoundingClientRect().bottom ?? 0;
        const threshold = Math.max(window.innerHeight / 3, navEnd);
        const active = headings.findLast(({ element }) => element.getBoundingClientRect().top <= threshold);
        setCurrent(active?.id ?? "sitA");
      });
    }

    function focusHash() {
      cancelAnimationFrame(focusFrame);
      // The shell measures the sticky bar before the scoped fragment scroll. A previous
      // topic can still have the same fragment ID while Next retains it in a hidden Activity.
      focusFrame = requestAnimationFrame(() => {
        focusFrame = requestAnimationFrame(() => {
          const active = headings.find(({ id }) => window.location.hash === `#${id}`);
          if (active === undefined) return;
          focusSection(active.element);
          setCurrent(active.id);
        });
      });
    }

    focusHash();
    trackSection();
    window.addEventListener("hashchange", focusHash);
    window.addEventListener("scroll", trackSection, { passive: true });
    window.addEventListener("resize", trackSection);
    return () => {
      cancelAnimationFrame(focusFrame);
      cancelAnimationFrame(scrollFrame);
      window.removeEventListener("hashchange", focusHash);
      window.removeEventListener("scroll", trackSection);
      window.removeEventListener("resize", trackSection);
    };
  }, [entries]);

  function renderEntry(entry: NavEntry, compact: boolean) {
    const isCurrent = (compact && current === "related" ? "general" : current) === entry.id;
    return (
      <a
        key={entry.id}
        href={`#${entry.id}`}
        aria-current={isCurrent ? true : undefined}
        className={cn(
          "flex items-center rounded-control border-transparent px-2 py-1 text-ui font-semibold min-block-touch hover:bg-accent-subtle",
          compact ? "justify-center border-be-4 text-center" : "border-s-4",
          isCurrent
            ? compact
              ? "border-be-accent text-accent"
              : "border-s-accent bg-accent-subtle text-accent"
            : "text-text-muted",
        )}
        onClick={(event) => {
          if (window.location.hash !== `#${entry.id}`) return;
          const root = event.currentTarget.closest("[data-study-topic]");
          const heading = root?.querySelector<HTMLElement>(`#${entry.id}`);
          if (heading != null) {
            event.preventDefault();
            focusSection(heading);
            setCurrent(entry.id);
          }
        }}
      >
        {compact && entry.compactLabel !== undefined ? (
          <>
            <span aria-hidden>{entry.compactLabel}</span>
            <span className="sr-only">{entry.label}</span>
          </>
        ) : (
          entry.label
        )}
      </a>
    );
  }

  return (
    <>
      <nav
        ref={mobileNav}
        aria-label={t("sectionNav")}
        data-sticky="section-nav"
        className="sticky inset-bs-0 z-10 grid grid-cols-3 gap-1 border-be border-border bg-surface py-1 xl:hidden short:static"
      >
        {entries.filter(({ id }) => id !== "related").map((entry) => renderEntry(entry, true))}
      </nav>
      <nav
        aria-label={t("sectionNav")}
        className="sticky inset-bs-6 hidden self-start rounded-card border border-border bg-surface-raised p-3 xl:grid xl:gap-1 short:static"
      >
        <p className="px-2 text-label text-text-muted">{t("sectionNav")}</p>
        {entries.map((entry) => renderEntry(entry, false))}
        <Link
          href={mockHref}
          className="flex items-center rounded-control px-2 text-ui text-accent min-block-touch hover:underline"
        >
          {t("practiseMock")}
        </Link>
      </nav>
    </>
  );
}
