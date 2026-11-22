"use client";

import { Collapsible } from "@base-ui/react/collapsible";
import { useId, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { Icon, type IconName } from "./icon";

type DisclosureProps = Pick<Collapsible.Root.Props, "open" | "defaultOpen" | "onOpenChange" | "disabled"> & {
  label: ReactNode;
  children: ReactNode;
  heading?: "h2" | "h3" | "h4" | "h5" | "h6";
  icon?: IconName;
  className?: string;
};

export function Disclosure({
  label,
  children,
  heading: Heading,
  icon,
  className,
  ...props
}: DisclosureProps) {
  const panelId = useId();
  const trigger = (
    <Collapsible.Trigger
      aria-controls={panelId}
      className={cn(
        "group flex items-center gap-2 rounded-control px-2 py-1 text-start text-(length:--text-ui)/(--leading-fa-ui) font-semibold inline-full min-block-touch min-inline-touch",
        "text-accent transition-colors duration-(--duration-fast) ease-standard enabled:hover:bg-accent-subtle enabled:active:bg-accent-subtle disabled:cursor-not-allowed disabled:text-text-muted",
      )}
    >
      {icon && <Icon name={icon} />}
      {label}
      <Icon
        name="chevron-down"
        className="ms-auto group-data-panel-open:rotate-180 motion-safe:transition-transform motion-safe:duration-(--duration-fast) motion-safe:ease-standard"
      />
    </Collapsible.Trigger>
  );

  return (
    <Collapsible.Root {...props} className={className}>
      {Heading ? <Heading>{trigger}</Heading> : trigger}
      <Collapsible.Panel
        id={panelId}
        keepMounted
        className="mbs-2 data-starting-style:opacity-0 motion-safe:transition-opacity motion-safe:duration-(--duration-base) motion-safe:ease-enter"
      >
        {children}
      </Collapsible.Panel>
    </Collapsible.Root>
  );
}
