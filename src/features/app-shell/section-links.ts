export type SectionLabel =
  "home" | "topics" | "mock" | "templates" | "guide" | "progress" | "settings" | "about" | "privacy";

type SectionLink = {
  href: string;
  label: SectionLabel;
  fullLabel?: "mockFull" | "templatesFull";
  section?: string;
};

export const primaryLinks: readonly SectionLink[] = [
  { href: "/", label: "home" },
  { href: "/topics", label: "topics" },
  { href: "/mock", label: "mock", fullLabel: "mockFull" },
  { href: "/templates", label: "templates", fullLabel: "templatesFull" },
  { href: "/guide/delproeve-2", label: "guide", section: "/guide" },
];

export const progressLink: SectionLink = { href: "/progress", label: "progress" };

export const utilityLinks: readonly SectionLink[] = [
  { href: "/settings", label: "settings" },
  { href: "/about", label: "about" },
  { href: "/privacy", label: "privacy" },
];

export function isCurrentSection(pathname: string, { href, section = href }: SectionLink) {
  return pathname === section || pathname.startsWith(section + "/");
}
