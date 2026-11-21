import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { Icon, type IconName } from "./icon";

const roleIcons = {
  "situation-intro": "message-circle",
  "first-question": "message-circle-question-mark",
  "second-question": "message-circle-question-mark",
  followup: "message-circle-more",
  "examiner-line": "message-circle",
  "sample-answer": "book-open-text",
  "short-sample-answer": "book-open-text",
  keywords: "key-round",
  "personal-example": "stethoscope",
  translation: "languages",
  "learner-recording": "mic",
} satisfies Record<string, IconName>;

export type ContentRole = keyof typeof roleIcons;

const examiner = { ink: "text-role-examiner", tint: "bg-role-examiner-subtle" };
const sample = { ink: "text-role-sample", tint: "bg-role-sample-subtle" };

const roleColors: Record<ContentRole, { ink: string; tint: string }> = {
  "situation-intro": examiner,
  "first-question": examiner,
  "second-question": examiner,
  followup: examiner,
  "examiner-line": examiner,
  "sample-answer": sample,
  "short-sample-answer": sample,
  keywords: { ink: "text-role-keyword", tint: "bg-role-keyword-subtle" },
  "personal-example": { ink: "text-role-example", tint: "bg-role-example-subtle" },
  translation: { ink: "text-text-muted", tint: "bg-surface-sunken" },
  "learner-recording": { ink: "text-role-you", tint: "bg-role-you-subtle" },
};

type RoleHeaderProps = {
  role: ContentRole;
  label: ReactNode;
  as?: "span" | "h3";
  source?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function RoleHeader({ role, label, as: Label = "span", source, action, className }: RoleHeaderProps) {
  const { ink, tint } = roleColors[role];
  const Group = Label === "h3" ? "div" : "span";

  return (
    <Group className={cn("flex flex-wrap items-center gap-2", className)}>
      <Group className={cn("flex items-center gap-2 min-inline-0", ink)}>
        <span className={cn("inline-grid shrink-0 place-items-center rounded-chip block-7 inline-7", tint)}>
          <Icon name={roleIcons[role]} size={16} />
        </span>
        <Label className="text-label">{label}</Label>
      </Group>
      {source != null && (
        <span className="text-(length:--text-caption)/(--text-caption--line-height) text-text-muted max-[22.5rem]:order-last max-[22.5rem]:basis-full">
          {source}
        </span>
      )}
      {action != null && <Group className="ms-auto">{action}</Group>}
    </Group>
  );
}
