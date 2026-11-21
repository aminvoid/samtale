"use client";

import { useDirection } from "@base-ui/react/direction-provider";
import { Tabs as BaseTabs } from "@base-ui/react/tabs";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type TabsProps = {
  label: string;
  items: readonly { value: string; label: ReactNode; panel: ReactNode; disabled?: boolean }[];
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null, details: BaseTabs.Root.ChangeEventDetails) => void;
  activateOnFocus?: boolean;
  className?: string;
};

export function Tabs({
  label,
  items,
  defaultValue,
  activateOnFocus = false,
  className,
  ...props
}: TabsProps) {
  const direction = useDirection();
  const [initialValue] = useState(() =>
    defaultValue === undefined ? items.find((item) => !item.disabled)?.value : defaultValue,
  );

  return (
    <BaseTabs.Root {...props} defaultValue={initialValue} dir={direction} className={className}>
      <BaseTabs.List
        aria-label={label}
        activateOnFocus={activateOnFocus}
        className="flex flex-wrap gap-2 rounded-control bg-surface-sunken p-1"
      >
        {items.map((item) => (
          <BaseTabs.Tab
            key={item.value}
            value={item.value}
            disabled={item.disabled}
            className={cn(
              "relative grow rounded-control px-3 py-1 text-(length:--text-ui)/(--leading-fa-ui) font-semibold text-text-muted min-block-touch min-inline-touch",
              "transition-colors duration-(--duration-fast) ease-standard not-data-disabled:hover:text-text not-data-disabled:active:bg-surface-raised",
              "data-active:bg-surface-raised data-active:font-bold data-active:text-text data-active:shadow-card",
              "aria-selected:after:absolute aria-selected:after:start-2 aria-selected:after:end-2 aria-selected:after:inset-be-0 aria-selected:after:rounded-full aria-selected:after:bg-accent aria-selected:after:block-0.75",
              "border border-transparent data-disabled:cursor-not-allowed data-disabled:border-dashed data-disabled:border-border-strong",
            )}
          >
            {item.label}
          </BaseTabs.Tab>
        ))}
      </BaseTabs.List>
      {items.map((item) => (
        <BaseTabs.Panel key={item.value} value={item.value} keepMounted className="mbs-4">
          {item.panel}
        </BaseTabs.Panel>
      ))}
    </BaseTabs.Root>
  );
}
