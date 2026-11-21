"use client";

import { AudioPlayer } from "@/components/ui/audio-player";
import { WordHighlighter } from "@/components/ui/word-highlighter";
import { useClip } from "@/lib/audio/player";
import type { Topic } from "@/lib/content/repository";
import { StudyClipButton } from "./study-clip-button";

type AnswerAudioProps = {
  item: Pick<Topic["general"]["question"]["modelAnswer"], "id" | "text" | "audio">;
  emphasis?: Topic["general"]["question"]["modelAnswer"]["emphasis"];
  label: string;
  example?: boolean;
};

export function AnswerAudio({ item, emphasis, label, example = false }: AnswerAudioProps) {
  const clip = useClip(item.id, item.audio);
  return (
    <div className="grid gap-3">
      {example ? (
        <StudyClipButton item={{ id: item.id, audio: item.audio }} label={label} variant="model" />
      ) : (
        <AudioPlayer itemId={item.id} audio={item.audio} label={label} />
      )}
      <WordHighlighter
        as="p"
        className={example ? "text-da-example wrap-anywhere" : "text-da-answer wrap-anywhere"}
        text={item.text.da}
        words={item.audio?.words}
        emphasis={emphasis}
        currentTimeMs={clip.currentTimeMs}
        status={clip.status}
      />
    </div>
  );
}
