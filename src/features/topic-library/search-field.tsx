import { useTranslations } from "next-intl";
import { useId, type ComponentPropsWithoutRef } from "react";
import { Icon } from "@/components/ui/icon";
import { IconButton } from "@/components/ui/icon-button";

type SearchFieldProps = Pick<ComponentPropsWithoutRef<"form">, "action" | "onSubmit"> & {
  value?: string;
  onChange?: (value: string) => void;
  onClear?: () => void;
};

export function SearchField({ action, onSubmit, value, onChange, onClear }: SearchFieldProps) {
  const t = useTranslations("library.search");
  const id = useId();
  return (
    <form action={action} onSubmit={onSubmit} role="search" data-keep-focus>
      <label htmlFor={id} className="mbe-1 block text-label">
        {t("label")}
      </label>
      <div className="relative">
        <Icon name="search" className="pointer-events-none absolute start-3 inset-bs-3.5 text-text-muted" />
        <input
          id={id}
          type="text"
          inputMode="search"
          name="q"
          dir="auto"
          autoComplete="off"
          placeholder={t("placeholder")}
          value={value}
          onChange={
            onChange
              ? (event) => {
                  onChange(event.currentTarget.value);
                }
              : undefined
          }
          className="rounded-control border border-border-strong bg-surface-raised px-11 py-2 text-ui inline-full min-block-12 placeholder:text-text-muted placeholder-shown:[direction:inherit] focus:border-accent"
        />
        {value && onClear && (
          <IconButton
            icon="x"
            label={t("clear")}
            className="absolute end-0.5 inset-bs-0.5"
            onClick={() => {
              onClear();
              document.getElementById(id)?.focus();
            }}
          />
        )}
        <button
          type="submit"
          className="sr-only focus:not-sr-only focus:absolute focus:end-0 focus:inset-bs-full focus:z-10 focus:rounded-control focus:bg-surface-raised focus:px-3 focus:min-block-touch"
        >
          {t("submit")}
        </button>
      </div>
    </form>
  );
}
