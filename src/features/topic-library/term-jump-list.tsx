import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { TermSummary } from "@/lib/content/repository";
import { cn } from "@/lib/utils/cn";
import { termsPath } from "./library-paths";
import { TermName } from "./term-name";

export function TermJumpList({
  terms,
  currentTerm,
}: {
  terms: readonly TermSummary[];
  currentTerm?: string;
}) {
  const t = useTranslations("library");
  const className =
    "inline-flex items-center justify-center rounded-chip border-2 px-3 min-block-touch min-inline-touch hover:bg-surface-sunken";
  return (
    <nav aria-label={t("termJump")} className="mbe-6">
      <ul className="flex flex-wrap gap-2">
        {terms.map((term) => (
          <li key={term.id}>
            {currentTerm === undefined ? (
              <a href={`#term-${term.id}`} className={cn(className, "border-border")}>
                <TermName term={term} />
              </a>
            ) : (
              <Link
                href={`${termsPath}/${term.id}`}
                aria-current={currentTerm === term.id ? "page" : undefined}
                className={cn(
                  className,
                  currentTerm === term.id ? "border-accent bg-accent-subtle" : "border-border",
                )}
              >
                <TermName term={term} className={currentTerm === term.id ? "text-accent" : undefined} />
              </Link>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
