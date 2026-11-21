"use client";

import { useDirection } from "@base-ui/react/direction-provider";
import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { useId, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { Icon } from "./icon";

type SegmentedControlProps<Value extends string> = Pick<
  RadioGroup.Props<Value>,
  "name" | "form" | "value" | "defaultValue" | "onValueChange" | "disabled" | "required"
> & {
  label: ReactNode;
  options: readonly { value: Value; label: ReactNode; disabled?: boolean }[];
  block?: boolean;
  className?: string;
};

export function SegmentedControl<Value extends string>({
  label,
  options,
  block = false,
  className,
  ...props
}: SegmentedControlProps<Value>) {
  const labelId = useId();
  const direction = useDirection();

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)} dir={direction}>
      <span id={labelId} className="text-label">
        {label}
      </span>
      <RadioGroup
        {...props}
        aria-labelledby={labelId}
        className={cn(
          "inline-flex flex-wrap gap-2 rounded-control border border-border-strong p-1 max-inline-full",
          block && "inline-full",
        )}
      >
        {options.map((option) => (
          <Radio.Root
            key={option.value}
            value={option.value}
            disabled={option.disabled}
            nativeButton
            render={<button />}
            className={cn(
              "inline-flex items-center justify-center gap-1 rounded-control px-2 py-1 text-ui font-semibold min-block-touch-primary min-inline-touch",
              // Apply checked foreground and background together to preserve contrast while selecting.
              "enabled:hover:bg-surface-sunken enabled:active:bg-surface-sunken",
              "disabled:cursor-not-allowed disabled:bg-surface-sunken disabled:text-text-muted data-checked:enabled:bg-accent data-checked:enabled:text-accent-contrast data-checked:enabled:hover:bg-accent-hover data-checked:enabled:active:bg-accent-active",
              block && "grow",
            )}
          >
            <span aria-hidden className="shrink-0 block-4 inline-4">
              <Radio.Indicator className="block">
                <Icon name="check" size={16} />
              </Radio.Indicator>
            </span>
            <span>{option.label}</span>
          </Radio.Root>
        ))}
      </RadioGroup>
    </div>
  );
}
