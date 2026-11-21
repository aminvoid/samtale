import {
  ArrowLeft,
  ArrowRight,
  AudioLines,
  AudioWaveform,
  BadgeCheck,
  BellOff,
  BookOpen,
  BookOpenText,
  Captions,
  CaptionsOff,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleAlert,
  CircleDot,
  CircleHelp,
  CirclePause,
  CircleStop,
  Clock3,
  Ellipsis,
  ExternalLink,
  FileQuestion,
  Flag,
  Headphones,
  House,
  Info,
  KeyRound,
  Languages,
  Layers,
  LayoutTemplate,
  LibraryBig,
  Lightbulb,
  ListChecks,
  LoaderCircle,
  Lock,
  LogOut,
  Menu,
  MessageCircle,
  MessageCircleMore,
  MessageCircleQuestionMark,
  MessagesSquare,
  Mic,
  MicOff,
  NotebookText,
  Pause,
  PenLine,
  Play,
  Quote,
  Repeat2,
  RotateCcw,
  Search,
  Settings,
  Share2,
  ShieldCheck,
  Shuffle,
  Signpost,
  Smartphone,
  Snail,
  Sparkle,
  Stethoscope,
  Trash2,
  Volume2,
  WifiOff,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

const icons = {
  "arrow-left": ArrowLeft,
  "arrow-right": ArrowRight,
  "audio-lines": AudioLines,
  "audio-waveform": AudioWaveform,
  "badge-check": BadgeCheck,
  "bell-off": BellOff,
  "book-open": BookOpen,
  "book-open-text": BookOpenText,
  captions: Captions,
  "captions-off": CaptionsOff,
  check: Check,
  "chevron-down": ChevronDown,
  "chevron-left": ChevronLeft,
  "chevron-right": ChevronRight,
  "chevron-up": ChevronUp,
  "circle-alert": CircleAlert,
  "circle-dot": CircleDot,
  "circle-help": CircleHelp,
  "circle-pause": CirclePause,
  "circle-stop": CircleStop,
  "clock-3": Clock3,
  ellipsis: Ellipsis,
  "external-link": ExternalLink,
  "file-question": FileQuestion,
  flag: Flag,
  headphones: Headphones,
  house: House,
  info: Info,
  "key-round": KeyRound,
  languages: Languages,
  layers: Layers,
  "layout-template": LayoutTemplate,
  "library-big": LibraryBig,
  lightbulb: Lightbulb,
  "list-checks": ListChecks,
  "loader-circle": LoaderCircle,
  lock: Lock,
  "log-out": LogOut,
  menu: Menu,
  "message-circle": MessageCircle,
  "message-circle-more": MessageCircleMore,
  "message-circle-question-mark": MessageCircleQuestionMark,
  "messages-square": MessagesSquare,
  mic: Mic,
  "mic-off": MicOff,
  "notebook-text": NotebookText,
  pause: Pause,
  "pen-line": PenLine,
  play: Play,
  quote: Quote,
  "repeat-2": Repeat2,
  "rotate-ccw": RotateCcw,
  search: Search,
  settings: Settings,
  "share-2": Share2,
  "shield-check": ShieldCheck,
  shuffle: Shuffle,
  signpost: Signpost,
  smartphone: Smartphone,
  snail: Snail,
  sparkle: Sparkle,
  stethoscope: Stethoscope,
  "trash-2": Trash2,
  "volume-2": Volume2,
  "wifi-off": WifiOff,
  x: X,
};

export type IconName = keyof typeof icons;
export type IconSize = 16 | 20 | 24;

const directionalIcons: ReadonlySet<IconName> = new Set([
  "arrow-left",
  "arrow-right",
  "chevron-left",
  "chevron-right",
  "external-link",
  "log-out",
]);

type IconProps = {
  name: IconName;
  size?: IconSize;
  label?: string;
  className?: string;
  mirrored?: boolean;
};

export function Icon({ name, size = 20, label, className, mirrored = true }: IconProps) {
  const Glyph = icons[name];
  return (
    <Glyph
      size={size}
      strokeWidth={2}
      focusable="false"
      role={label === undefined ? undefined : "img"}
      aria-label={label}
      aria-hidden={label === undefined ? true : undefined}
      className={cn(
        "shrink-0",
        mirrored && directionalIcons.has(name) && "rtl:-scale-x-100 [&:dir(ltr)]:scale-x-100",
        className,
      )}
    />
  );
}
