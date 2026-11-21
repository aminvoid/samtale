import type { ReactNode, Ref } from "react";

/** The persistent primary slot (UXD-08): one button whose label and state change with the phase. */
export function PrimaryAction({
  label,
  onClick,
  describedBy,
  ref,
}: {
  ref?: Ref<HTMLButtonElement>;
  label: ReactNode;
  onClick?: () => void;
  describedBy?: string;
}) {
  return (
    <button
      ref={ref}
      data-primary-slot
      type="button"
      aria-disabled={onClick === undefined}
      aria-describedby={describedBy}
      onClick={onClick}
      className="inline-flex items-center justify-center rounded-control border border-transparent bg-accent px-4 py-2 text-center font-semibold text-accent-contrast inline-full min-block-touch-primary hover:bg-accent-hover aria-disabled:cursor-default aria-disabled:border-border aria-disabled:bg-surface-sunken aria-disabled:text-text-muted"
    >
      {label}
    </button>
  );
}
