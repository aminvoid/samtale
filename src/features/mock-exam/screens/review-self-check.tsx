import { useTranslations } from "next-intl";
import { useId } from "react";
import { DanishText } from "@/components/ui/danish-text";
import { Disclosure } from "@/components/ui/disclosure";
import { FocusItemSchema, type FocusItem } from "@/lib/progress/schema";
import { mockCard } from "./presentation";

export function ReviewSelfCheck({
  role,
  general,
  ticks,
  onChange,
}: {
  role: string;
  general: boolean;
  ticks: Partial<Record<FocusItem, boolean>>;
  onChange: (item: FocusItem, checked: boolean) => void;
}) {
  const t = useTranslations("mock.review");
  const id = useId();
  const items = FocusItemSchema.options.filter((key) => general || key !== "coveredBothSides");
  return (
    <fieldset className={mockCard}>
      <legend className="px-2 text-h3">{t("selfCheck", { role })}</legend>
      <p className="mbe-3 text-caption text-text-muted">{t("checkPrivate")}</p>
      <ul className="grid gap-x-4 gap-y-2 lg:grid-cols-2">
        {items.map((key) => (
          <li key={key} className="grid items-start rounded-control bg-surface-sunken p-2">
            <label className="flex items-center gap-3 min-block-touch">
              <input
                className="shrink-0 accent-accent block-5 inline-5"
                type="checkbox"
                checked={ticks[key] ?? false}
                aria-describedby={`${id}-${key}`}
                onChange={(event) => {
                  onChange(key, event.currentTarget.checked);
                }}
              />
              {t(`check.${key}.label`)}
            </label>
            <DanishText as="p" className="ps-2 text-caption text-text-muted">
              {t.markup(`check.${key}.example`, { da: (text) => text })}
            </DanishText>
            <Disclosure label={t("checkExplain")}>
              <p id={`${id}-${key}`} className="px-2 text-caption">
                {t(`check.${key}.explain`)}
              </p>
            </Disclosure>
          </li>
        ))}
      </ul>
    </fieldset>
  );
}
