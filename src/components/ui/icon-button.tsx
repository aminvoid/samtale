import { Button, type ButtonProps } from "./button";

export type IconButtonProps = Omit<
  ButtonProps,
  "variant" | "size" | "block" | "children" | "aria-label" | "icon"
> & {
  label: string;
  icon: NonNullable<ButtonProps["icon"]>;
};

export function IconButton({ label, ...props }: IconButtonProps) {
  return <Button {...props} variant="icon-only" aria-label={label} />;
}
