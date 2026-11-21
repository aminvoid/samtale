import type { AudioClip, AudioPlayerController } from "@/lib/audio/player";
import { preloadClips } from "@/lib/audio/preload";
import type { MockDeck } from "@/lib/content/repository";
import type { AudioPort } from "../ports";

function indexClips(deck: MockDeck) {
  const clips = new Map<string, AudioClip>();
  function add(id: string, audio: Omit<AudioClip, "id"> | undefined) {
    if (audio) clips.set(id, { id, url: audio.url, durationMs: audio.durationMs });
  }
  for (const line of deck.examinerLines) add(line.id, line.audio);
  for (const topic of deck.topics) {
    for (const { lineId, audio } of topic.examinerAudio) add(`${lineId}:${topic.id}`, audio);
    for (const situation of topic.situations) add(situation.intro.id, situation.intro.audio);
    for (const { question, followups } of [...topic.situations, topic.general]) {
      add(question.id, question.audio);
      for (const item of followups) add(item.id, item.audio);
    }
  }
  return clips;
}

export function createAudioPort(player: AudioPlayerController, deck: MockDeck): AudioPort {
  const clips = indexClips(deck);
  let assets: ReturnType<typeof preloadClips> | undefined;
  let urls: ReadonlyMap<string, string> | undefined;
  let unsubscribe: (() => void) | undefined;
  let ownedClipId: string | undefined;

  function detach() {
    unsubscribe?.();
    unsubscribe = undefined;
  }

  function stop() {
    detach();
    if (ownedClipId !== undefined && player.getSnapshot().clipId === ownedClipId) player.stop();
    ownedClipId = undefined;
  }

  function releaseAssets() {
    assets?.revoke();
    assets = undefined;
    urls = undefined;
  }

  return {
    async preload(clipIds, progress) {
      releaseAssets();
      const sources = clipIds.map((id) => {
        const clip = clips.get(id);
        if (clip) return clip.url;
        throw new Error(`Missing examiner audio: ${id}`);
      });
      const request = preloadClips(sources, progress);
      assets = request;
      const loaded = await request.promise;
      if (assets === request) urls = loaded;
    },
    play(clipId, rate, notify) {
      detach();
      const clip = clips.get(clipId);
      if (clip === undefined) {
        stop();
        notify("failed");
        return;
      }
      const playable = { ...clip, url: urls?.get(clip.url) ?? clip.url };
      player.setRate(rate === 0.75 || rate === 1.25 ? rate : 1);
      ownedClipId = clipId;
      let seen = false;
      let started = false;
      let listening = true;
      function observe() {
        if (!listening) return;
        const snapshot = player.getSnapshot();
        if (snapshot.clipId !== clipId) {
          if (seen) finish("interrupted");
          return;
        }
        seen = true;
        if (snapshot.status === "playing" && !started) {
          started = true;
          notify("started");
        } else if (snapshot.status === "ended") finish("ended");
        else if (snapshot.status === "error")
          finish(snapshot.error === "playback-blocked" ? "blocked" : "failed");
        else if (snapshot.status === "paused" && snapshot.interrupted) finish("interrupted");
      }
      function finish(signal: Exclude<Parameters<typeof notify>[0], "started">) {
        listening = false;
        detach();
        notify(signal);
      }
      unsubscribe = player.subscribe(observe);
      try {
        player.play(playable);
        // The shared transport deduplicates an already playing clip.
        observe();
      } catch {
        stop();
        notify("failed");
      }
    },
    pause() {
      detach();
      if (ownedClipId !== undefined && player.getSnapshot().clipId === ownedClipId) {
        player.pause();
        player.seek(0);
      }
    },
    stop,
    releaseAssets,
  };
}
