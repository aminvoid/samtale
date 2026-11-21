import { Button, type ButtonProps } from "./button";
import type { IconName } from "./icon";

export type IconButtonProps = Omit<
  ButtonProps,
  "variant" | "size" | "block" | "children" | "aria-label" | "icon"
> & {
  label: string;
  icon: IconName;
};

export function IconButton({ label, ...props }: IconButtonProps) {
  return <Button {...props} variant="icon-only" aria-label={label} />;
}
