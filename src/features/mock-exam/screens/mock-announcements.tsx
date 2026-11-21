import { useTranslations } from "next-intl";
import { DanishText } from "@/components/ui/danish-text";
import { LiveRegion } from "@/components/ui/live-region";
import { richTags } from "@/i18n/rich-tags";
import type { MockDeck } from "@/lib/content/repository";
import { examConfig } from "@/lib/exam/config";
import type { AnnouncePort } from "../index";

export type MockAnnouncement = Parameters<AnnouncePort["emit"]>[0];

export function MockAnnouncements({
  messages,
  deck,
  revision,
}: {
  messages: readonly MockAnnouncement[];
  deck: MockDeck;
  revision: number;
}) {
  const t = useTranslations();
  return (
    <LiveRegion>
      <div key={revision}>
        {messages.map((message, index) => {
          switch (message.key) {
            case "mock.live.revealed": {
              const topic = deck.topics.find(({ id }) => id === message.params.topicName.topicId);
              return (
                topic && (
                  <div key={index}>
                    {t.rich(message.key, {
                      ...richTags,
                      letter: message.params.letter,
                      name: topic.title.da,
                      topic: (text) => <DanishText>{text}</DanishText>,
                    })}
                  </div>
                )
              );
            }
            case "mock.live.situationChosen":
              return <div key={index}>{t.rich(message.key, { ...richTags, key: message.params.key })}</div>;
            case "mock.live.lookStarted":
              return <div key={index}>{t(message.key, { seconds: examConfig.lookSeconds })}</div>;
            case "mock.live.recordingCapped":
              return (
                <div key={index}>{t(message.key, { minutes: examConfig.maxRecordingSeconds / 60 })}</div>
              );
            case "mock.live.lookEnded":
            case "mock.live.yourTurnRecording":
            case "mock.live.yourTurn":
            case "mock.live.oneMinuteLeft":
            case "mock.live.handover":
            case "mock.live.finishSentence":
            case "mock.live.notRecording":
            case "mock.live.paused":
            case "mock.live.resumed":
            case "mock.live.rerecording":
            case "mock.live.examOver":
            case "mock.live.saveFailed":
              return <div key={index}>{t(message.key)}</div>;
          }
        })}
      </div>
    </LiveRegion>
  );
}
