import type { IconName } from "@/components/ui/icon";

type SectionLink = {
  href: string;
  label: "home" | "topics" | "mock" | "templates" | "guide" | "progress" | "settings" | "about" | "privacy";
  fullLabel?: "mockFull" | "templatesFull";
  icon: IconName;
  section?: string;
};

export const primaryLinks: readonly SectionLink[] = [
  { href: "/", label: "home", icon: "house" },
  { href: "/topics", label: "topics", icon: "library-big" },
  { href: "/mock", label: "mock", fullLabel: "mockFull", icon: "messages-square" },
  { href: "/templates", label: "templates", fullLabel: "templatesFull", icon: "quote" },
  { href: "/guide/delproeve-2", label: "guide", icon: "signpost", section: "/guide" },
];

export const progressLink: SectionLink = { href: "/progress", label: "progress", icon: "notebook-text" };

export const utilityLinks: readonly SectionLink[] = [
  { href: "/settings", label: "settings", icon: "settings" },
  { href: "/about", label: "about", icon: "info" },
  { href: "/privacy", label: "privacy", icon: "shield-check" },
];

export function isCurrentSection(pathname: string, { href, section = href }: SectionLink) {
  return pathname === section || pathname.startsWith(section + "/");
}
