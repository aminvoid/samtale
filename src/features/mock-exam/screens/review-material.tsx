import { useTranslations } from "next-intl";
import { AudioPlayer } from "@/components/ui/audio-player";
import { DanishText } from "@/components/ui/danish-text";
import { SourceLabel } from "@/components/ui/source-label";
import { richTags } from "@/i18n/rich-tags";
import type { ExaminerLines, Topic } from "@/lib/content/repository";
import type { AttemptRecord, FocusItem, SelfCheckTicks } from "@/lib/progress/schema";
import { ReviewQuestion } from "./review-question";
import { ReviewSelfCheck } from "./review-self-check";
import type { ReviewTakeSource } from "./review-take";

type CheckProps = {
  ticks: SelfCheckTicks;
  update: (group: keyof SelfCheckTicks, item: FocusItem, checked: boolean) => void;
};

export function ReviewMaterial({
  topic,
  lines,
  attempt,
  recordings = [],
  check,
}: {
  topic: Topic;
  lines: ExaminerLines;
  attempt?: AttemptRecord;
  recordings?: readonly ReviewTakeSource[];
  check?: CheckProps;
}) {
  const t = useTranslations("mock");
  const asked = attempt?.askedItemIds;
  const heard = (id: string) => asked === undefined || asked.includes(id);
  const situations = attempt
    ? topic.situations.filter(({ key }) => key === attempt.situationKey)
    : topic.situations;
  const general = topic.general;
  const transition = lines.find(({ role }) => role === "transition");
  const showGeneral = heard(general.question.id) || general.followups.some(({ id }) => heard(id));

  function review(section: Topic["general"], fragment: string, role: "first" | "second") {
    const prompts = [section.question, ...section.followups];
    const ordered = asked?.flatMap((id) => prompts.find((prompt) => prompt.id === id) ?? []) ?? prompts;
    return ordered.map((item) => (
      <ReviewQuestion
        key={item.id}
        item={item}
        role={item.id === section.question.id ? role : "followup"}
        topicId={topic.id}
        section={fragment}
        showTakes={attempt !== undefined}
        recordings={recordings.filter(({ itemId }) => itemId === item.id)}
      />
    ));
  }

  return (
    <div className="grid gap-6">
      {situations
        .filter(
          (situation) => heard(situation.question.id) || situation.followups.some(({ id }) => heard(id)),
        )
        .map((situation) => (
          <section key={situation.key} className="grid gap-4">
            <h2 className="text-h2">
              {t.rich("review.partFirst", {
                key: situation.key,
                letter: (text) => <DanishText as="bdi">{text}</DanishText>,
              })}
            </h2>
            {situation.intro && (
              <div className="grid gap-2 rounded-card bg-role-examiner-subtle p-4">
                <h3 className="text-h3">{t("review.intro")}</h3>
                <DanishText as="p" className="text-da-line">
                  {situation.intro.text.da}
                </DanishText>
                <SourceLabel variant={situation.intro.origin === "app" ? "app" : "siri"}>
                  {t.rich(situation.intro.origin === "app" ? "examiner.app" : "examiner.siri", richTags)}
                </SourceLabel>
                {situation.intro.audio && (
                  <AudioPlayer
                    itemId={situation.intro.id}
                    audio={situation.intro.audio}
                    label={t("review.playPrompt")}
                  />
                )}
              </div>
            )}
            {review(situation, `sit${situation.key}`, "first")}
            {check && heard(situation.question.id) && (
              <ReviewSelfCheck
                role={t("examiner.first")}
                general={false}
                ticks={check.ticks.first}
                onChange={(item, checked) => {
                  check.update("first", item, checked);
                }}
              />
            )}
          </section>
        ))}
      {showGeneral && (
        <section className="grid gap-4">
          <h2 className="text-h2">{t("review.partSecond")}</h2>
          {transition && (
            <div className="grid gap-2 rounded-card bg-role-examiner-subtle p-4">
              <DanishText as="p" className="text-da-line">
                {transition.text.da}
              </DanishText>
              <SourceLabel variant="app">{t("examiner.app")}</SourceLabel>
            </div>
          )}
          {review(general, "general", "second")}
          {check && heard(general.question.id) && (
            <ReviewSelfCheck
              role={t("examiner.second")}
              general
              ticks={check.ticks.general}
              onChange={(item, checked) => {
                check.update("general", item, checked);
              }}
            />
          )}
        </section>
      )}
    </div>
  );
}
