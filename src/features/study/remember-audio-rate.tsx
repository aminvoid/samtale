"use client";

import { useEffect } from "react";
import { useAudioPlayer } from "@/lib/audio/player";
import { getStudyProgressStore } from "./study-progress-store";

export function RememberAudioRate() {
  const player = useAudioPlayer();

  useEffect(() => {
    const store = getStudyProgressStore();
    let active = true;
    let changed = false;
    let rate = player.getSnapshot().rate;

    void store
      .getSettings()
      .then((result) => {
        if (active && !changed && result.ok) {
          rate = result.value.playbackRate;
          player.setRate(rate);
        }
      })
      .catch(() => undefined);

    const unsubscribe = player.subscribe(() => {
      const next = player.getSnapshot().rate;
      if (next === rate) return;
      rate = next;
      changed = true;
      void store.updateSettings({ playbackRate: next }).catch(() => undefined);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [player]);

  return null;
}
