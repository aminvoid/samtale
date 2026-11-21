import {
  Backpack,
  BriefcaseBusiness,
  Building2,
  Drama,
  GraduationCap,
  HandHeart,
  HeartPulse,
  Leaf,
  Scale,
  Smartphone,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { IconSize } from "./icon";

const themeIcons = {
  arbejde: BriefcaseBusiness,
  uddannelse: GraduationCap,
  sundhed: HeartPulse,
  medier: Smartphone,
  klima: Leaf,
  boern: Backpack,
  krim: Scale,
  bolig: Building2,
  frivillig: HandHeart,
  kultur: Drama,
};

export type ThemeIconId = keyof typeof themeIcons;

type ThemeIconProps = { themeId: ThemeIconId; size?: IconSize; className?: string };

export function ThemeIcon({ themeId, size = 20, className }: ThemeIconProps) {
  const Glyph = themeIcons[themeId];
  return (
    <Glyph size={size} strokeWidth={2} aria-hidden focusable="false" className={cn("shrink-0", className)} />
  );
}
