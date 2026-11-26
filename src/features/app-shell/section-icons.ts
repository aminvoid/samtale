import {
  IconHouse,
  IconInfo,
  IconLibraryBig,
  IconMessagesSquare,
  IconNotebookText,
  IconQuote,
  IconSettings,
  IconShieldCheck,
  IconSignpost,
  type IconComponent,
} from "@/components/ui/icon";
import type { SectionLabel } from "./section-links";

export const sectionIcons: Record<SectionLabel, IconComponent> = {
  home: IconHouse,
  topics: IconLibraryBig,
  mock: IconMessagesSquare,
  templates: IconQuote,
  guide: IconSignpost,
  progress: IconNotebookText,
  settings: IconSettings,
  about: IconInfo,
  privacy: IconShieldCheck,
};
