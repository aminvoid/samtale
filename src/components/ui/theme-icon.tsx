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
import { Icon, type IconSize } from "./icon";

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

function isThemeIconId(id: string): id is ThemeIconId {
  return Object.hasOwn(themeIcons, id);
}

type ThemeIconProps = { themeId: string; size?: IconSize; className?: string };

export function ThemeIcon({ themeId, size = 20, className }: ThemeIconProps) {
  if (!isThemeIconId(themeId)) return <Icon name="library-big" size={size} className={className} />;
  const Glyph = themeIcons[themeId];
  return (
    <Glyph size={size} strokeWidth={2} aria-hidden focusable="false" className={cn("shrink-0", className)} />
  );
}
