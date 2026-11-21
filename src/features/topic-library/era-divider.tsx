import { useTranslations } from "next-intl";
import { ListInfoButton } from "./list-info-button";
import { TermName } from "./term-name";

const firstCurrentTerm = { year: 2023, session: "maj" } satisfies Parameters<typeof TermName>[0]["term"];

export function EraDivider({ showCurrent = true }: { showCurrent?: boolean }) {
  const t = useTranslations("library");
  const term = () => <TermName term={firstCurrentTerm} />;

  return (
    <div className="mbs-6">
      {showCurrent && <p className="mbe-2 text-label text-text-muted">{t.rich("eraCurrent", { term })}</p>}
      <h2 className="border-bs border-border pbs-3 text-label">{t.rich("eraOlder", { term })}</h2>
      <ListInfoButton />
    </div>
  );
}
