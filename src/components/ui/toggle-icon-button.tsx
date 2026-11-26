import { cn } from "@/lib/utils/cn";
import { IconButton, type IconButtonProps } from "./icon-button";

type ToggleIconButtonProps = Omit<IconButtonProps, "aria-pressed" | "aria-labelledby"> & {
  pressed: boolean;
  pressedIcon?: IconButtonProps["icon"];
};

/** Pass the same label in both states. The icon can change independently of the name. */
export function ToggleIconButton({ pressed, pressedIcon, icon, className, ...props }: ToggleIconButtonProps) {
  return (
    <IconButton
      {...props}
      icon={pressed ? (pressedIcon ?? icon) : icon}
      aria-pressed={pressed}
      className={cn("aria-pressed:border-2 aria-pressed:border-accent", className)}
    />
  );
}
