import { useTranslations } from "next-intl";
import { Disclosure } from "@/components/ui/disclosure";
import { RoleHeader } from "@/components/ui/role-header";
import { Link } from "@/i18n/navigation";
import type { Topic } from "@/lib/content/repository";
import { AnswerAudio } from "./answer-audio";

type Section = Topic["general"];
type AnswerDisclosureProps =
  | { kind: "model"; item: Section["question"]["modelAnswer"]; template: 1 | 2 }
  | { kind: "short"; item: Section["followups"][number]["answer"] }
  | { kind: "example"; item: Section["personalExamples"][number] };

export function AnswerDisclosure(props: AnswerDisclosureProps) {
  const t = useTranslations("study");
  const { kind, item } = props;
  const example = kind === "example";
  const short = kind === "short";
  const role = example ? "personal-example" : short ? "short-sample-answer" : "sample-answer";
  const label = t(example ? "example" : short ? "shortAnswer" : "sample");
  const playLabel = t(example ? "playExample" : short ? "playShortAnswer" : "playSample");

  return (
    <Disclosure
      heading="h3"
      label={<RoleHeader role={role} label={label} />}
      className="rounded-card border border-border bg-surface-raised p-2"
    >
      <div className="grid gap-3 px-2 pbe-2">
        {kind === "model" && (
          <Link
            href="/templates"
            className="inline-flex items-center justify-self-start text-caption text-accent underline min-block-touch"
          >
            {t("basedOnTemplate", { number: props.template })}
          </Link>
        )}
        <AnswerAudio
          item={{ id: item.id, text: item.text, audio: item.audio }}
          emphasis={kind === "example" ? undefined : props.item.emphasis}
          label={playLabel}
          example={example}
        />
        {example && <p className="text-caption text-text-muted">{t("exampleTip")}</p>}
      </div>
    </Disclosure>
  );
}
