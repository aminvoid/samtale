import {
  ArrowLeft,
  ArrowRight,
  AudioLines,
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
  CircleAlert,
  CircleDot,
  CircleHelp,
  CirclePause,
  Clock3,
  ExternalLink,
  Headphones,
  House,
  Info,
  KeyRound,
  Languages,
  Layers,
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
  Signpost,
  Smartphone,
  Snail,
  Stethoscope,
  Trash2,
  Volume2,
  X,
  type LucideIcon,
} from "lucide-react";
import type { ReactElement } from "react";
import { cn } from "@/lib/utils/cn";

export type IconSize = 16 | 20 | 24;
type IconProps = {
  size?: IconSize;
  label?: string;
  className?: string;
  mirrored?: boolean;
};

export type IconComponent = (props: IconProps) => ReactElement;

function Icon({
  glyph: Glyph,
  directional = false,
  size = 20,
  label,
  className,
  mirrored = true,
}: IconProps & { glyph: LucideIcon; directional?: boolean }) {
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
        mirrored && directional && "rtl:-scale-x-100 [&:dir(ltr)]:scale-x-100",
        className,
      )}
    />
  );
}

export function IconArrowLeft(props: IconProps) {
  return <Icon glyph={ArrowLeft} directional {...props} />;
}

export function IconArrowRight(props: IconProps) {
  return <Icon glyph={ArrowRight} directional {...props} />;
}

export function IconAudioLines(props: IconProps) {
  return <Icon glyph={AudioLines} {...props} />;
}

export function IconBadgeCheck(props: IconProps) {
  return <Icon glyph={BadgeCheck} {...props} />;
}

export function IconBellOff(props: IconProps) {
  return <Icon glyph={BellOff} {...props} />;
}

export function IconBookOpen(props: IconProps) {
  return <Icon glyph={BookOpen} {...props} />;
}

export function IconBookOpenText(props: IconProps) {
  return <Icon glyph={BookOpenText} {...props} />;
}

export function IconCaptions(props: IconProps) {
  return <Icon glyph={Captions} {...props} />;
}

export function IconCaptionsOff(props: IconProps) {
  return <Icon glyph={CaptionsOff} {...props} />;
}

export function IconCheck(props: IconProps) {
  return <Icon glyph={Check} {...props} />;
}

export function IconChevronDown(props: IconProps) {
  return <Icon glyph={ChevronDown} {...props} />;
}

export function IconChevronLeft(props: IconProps) {
  return <Icon glyph={ChevronLeft} directional {...props} />;
}

export function IconChevronRight(props: IconProps) {
  return <Icon glyph={ChevronRight} directional {...props} />;
}

export function IconCircleAlert(props: IconProps) {
  return <Icon glyph={CircleAlert} {...props} />;
}

export function IconCircleDot(props: IconProps) {
  return <Icon glyph={CircleDot} {...props} />;
}

export function IconCircleHelp(props: IconProps) {
  return <Icon glyph={CircleHelp} {...props} />;
}

export function IconCirclePause(props: IconProps) {
  return <Icon glyph={CirclePause} {...props} />;
}

export function IconClock3(props: IconProps) {
  return <Icon glyph={Clock3} {...props} />;
}

export function IconExternalLink(props: IconProps) {
  return <Icon glyph={ExternalLink} directional {...props} />;
}

export function IconHeadphones(props: IconProps) {
  return <Icon glyph={Headphones} {...props} />;
}

export function IconHouse(props: IconProps) {
  return <Icon glyph={House} {...props} />;
}

export function IconInfo(props: IconProps) {
  return <Icon glyph={Info} {...props} />;
}

export function IconKeyRound(props: IconProps) {
  return <Icon glyph={KeyRound} {...props} />;
}

export function IconLanguages(props: IconProps) {
  return <Icon glyph={Languages} {...props} />;
}

export function IconLayers(props: IconProps) {
  return <Icon glyph={Layers} {...props} />;
}

export function IconLibraryBig(props: IconProps) {
  return <Icon glyph={LibraryBig} {...props} />;
}

export function IconLightbulb(props: IconProps) {
  return <Icon glyph={Lightbulb} {...props} />;
}

export function IconListChecks(props: IconProps) {
  return <Icon glyph={ListChecks} {...props} />;
}

export function IconLoaderCircle(props: IconProps) {
  return <Icon glyph={LoaderCircle} {...props} />;
}

export function IconLock(props: IconProps) {
  return <Icon glyph={Lock} {...props} />;
}

export function IconLogOut(props: IconProps) {
  return <Icon glyph={LogOut} directional {...props} />;
}

export function IconMenu(props: IconProps) {
  return <Icon glyph={Menu} {...props} />;
}

export function IconMessageCircle(props: IconProps) {
  return <Icon glyph={MessageCircle} {...props} />;
}

export function IconMessageCircleMore(props: IconProps) {
  return <Icon glyph={MessageCircleMore} {...props} />;
}

export function IconMessageCircleQuestionMark(props: IconProps) {
  return <Icon glyph={MessageCircleQuestionMark} {...props} />;
}

export function IconMessagesSquare(props: IconProps) {
  return <Icon glyph={MessagesSquare} {...props} />;
}

export function IconMic(props: IconProps) {
  return <Icon glyph={Mic} {...props} />;
}

export function IconMicOff(props: IconProps) {
  return <Icon glyph={MicOff} {...props} />;
}

export function IconNotebookText(props: IconProps) {
  return <Icon glyph={NotebookText} {...props} />;
}

export function IconPause(props: IconProps) {
  return <Icon glyph={Pause} {...props} />;
}

export function IconPenLine(props: IconProps) {
  return <Icon glyph={PenLine} {...props} />;
}

export function IconPlay(props: IconProps) {
  return <Icon glyph={Play} {...props} />;
}

export function IconQuote(props: IconProps) {
  return <Icon glyph={Quote} {...props} />;
}

export function IconRepeat2(props: IconProps) {
  return <Icon glyph={Repeat2} {...props} />;
}

export function IconRotateCcw(props: IconProps) {
  return <Icon glyph={RotateCcw} {...props} />;
}

export function IconSearch(props: IconProps) {
  return <Icon glyph={Search} {...props} />;
}

export function IconSettings(props: IconProps) {
  return <Icon glyph={Settings} {...props} />;
}

export function IconShare2(props: IconProps) {
  return <Icon glyph={Share2} {...props} />;
}

export function IconShieldCheck(props: IconProps) {
  return <Icon glyph={ShieldCheck} {...props} />;
}

export function IconSignpost(props: IconProps) {
  return <Icon glyph={Signpost} {...props} />;
}

export function IconSmartphone(props: IconProps) {
  return <Icon glyph={Smartphone} {...props} />;
}

export function IconSnail(props: IconProps) {
  return <Icon glyph={Snail} {...props} />;
}

export function IconStethoscope(props: IconProps) {
  return <Icon glyph={Stethoscope} {...props} />;
}

export function IconTrash2(props: IconProps) {
  return <Icon glyph={Trash2} {...props} />;
}

export function IconVolume2(props: IconProps) {
  return <Icon glyph={Volume2} {...props} />;
}

export function IconX(props: IconProps) {
  return <Icon glyph={X} {...props} />;
}
