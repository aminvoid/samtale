import type { AudioRef } from "@/lib/content/schema/published";

export type PlaybackRate = 0.75 | 1 | 1.25;
export type ClipStatus = "idle" | "loading" | "playing" | "paused" | "ended" | "error";
export type ClipError = "playback-blocked" | "media";
export type AudioClip = Pick<AudioRef, "url" | "durationMs"> & { id: string };

export type PlayerSnapshot = Readonly<{
  clipId: string | null;
  status: ClipStatus;
  currentTimeMs: number;
  durationMs: number | null;
  rate: PlaybackRate;
  error: ClipError | null;
  interrupted: boolean;
}>;

const initialSnapshot: PlayerSnapshot = {
  clipId: null,
  status: "idle",
  currentTimeMs: 0,
  durationMs: null,
  rate: 1,
  error: null,
  interrupted: false,
};

export function createAudioPlayer() {
  const listeners = new Set<() => void>();
  let idle = initialSnapshot;
  let snapshot = idle;
  let audio: HTMLAudioElement | undefined;
  let clip: AudioClip | undefined;
  let playRequest: symbol | undefined;
  let hasStarted = false;
  let frame: number | undefined;

  function publish(next: PlayerSnapshot) {
    if (
      snapshot.clipId === next.clipId &&
      snapshot.status === next.status &&
      snapshot.currentTimeMs === next.currentTimeMs &&
      snapshot.durationMs === next.durationMs &&
      snapshot.rate === next.rate &&
      snapshot.error === next.error &&
      snapshot.interrupted === next.interrupted
    ) {
      return;
    }
    snapshot = next;
    for (const listener of listeners) listener();
  }

  function update(patch: Partial<PlayerSnapshot>) {
    publish({ ...snapshot, ...patch });
  }

  function readTimes(media: HTMLAudioElement) {
    const durationMs = Number.isFinite(media.duration)
      ? Math.ceil(media.duration * 1000)
      : (snapshot.durationMs ?? (hasStarted ? (clip?.durationMs ?? null) : null));
    const position = snapshot.status === "ended" ? 0 : Math.floor(media.currentTime * 1000);
    return { durationMs, currentTimeMs: Math.min(position, durationMs ?? position) };
  }

  function syncTime() {
    if (audio === undefined || clip === undefined || snapshot.status === "error") return;
    update(readTimes(audio));
  }

  function tick() {
    frame = undefined;
    const request = playRequest;
    syncTime();
    if (playRequest === request && snapshot.status === "playing") frame ??= requestAnimationFrame(tick);
  }

  function stopFrame() {
    if (frame === undefined) return;
    cancelAnimationFrame(frame);
    frame = undefined;
  }

  function cancelPlay() {
    playRequest = undefined;
    hasStarted = false;
    stopFrame();
  }

  function onPlaying() {
    const request = playRequest;
    if (request === undefined || audio?.paused !== false) return;
    hasStarted = true;
    update({ ...readTimes(audio), status: "playing" });
    if (playRequest === request) frame ??= requestAnimationFrame(tick);
  }

  function onWaiting() {
    if (playRequest === undefined || audio?.paused !== false) return;
    stopFrame();
    update({ status: "loading" });
  }

  function onPause() {
    if (audio?.ended) return;
    if (playRequest !== undefined && audio?.paused === true && hasStarted) {
      cancelPlay();
      update({ ...readTimes(audio), status: "paused", interrupted: true });
    }
  }

  function onEnded() {
    if (playRequest === undefined || audio?.ended !== true) return;
    cancelPlay();
    update({ status: "ended", currentTimeMs: 0 });
  }

  function fail(error: ClipError) {
    cancelPlay();
    update({ status: "error", error });
  }

  function onError() {
    if (clip !== undefined && audio?.error != null) fail("media");
  }

  const mediaEvents = {
    durationchange: syncTime,
    loadedmetadata: syncTime,
    timeupdate: syncTime,
    playing: onPlaying,
    waiting: onWaiting,
    pause: onPause,
    ended: onEnded,
    error: onError,
  };

  function getAudio() {
    if (audio === undefined) {
      audio = document.createElement("audio");
      audio.preload = "none";
      audio.preservesPitch = true;
      if ("webkitPreservesPitch" in audio) audio.webkitPreservesPitch = true;
      for (const [event, listener] of Object.entries(mediaEvents)) audio.addEventListener(event, listener);
    }
    return audio;
  }

  /** Call directly from the first tap to unlock this element on iOS. */
  function play(next: AudioClip) {
    if (playRequest !== undefined && clip?.id === next.id && clip.url === next.url) return;

    const media = getAudio();
    const replaceSource = clip?.id !== next.id || clip.url !== next.url || snapshot.error === "media";
    const replay = snapshot.status === "ended";
    cancelPlay();
    if (replaceSource) {
      if (clip !== undefined) media.pause();
      media.src = next.url;
    } else if (replay) {
      media.currentTime = 0;
    }

    clip = next;
    const request = Symbol();
    playRequest = request;
    media.defaultPlaybackRate = snapshot.rate;
    media.playbackRate = snapshot.rate;
    update({
      clipId: next.id,
      status: "loading",
      currentTimeMs: replaceSource || replay ? 0 : snapshot.currentTimeMs,
      durationMs: replaceSource ? null : snapshot.durationMs,
      error: null,
      interrupted: false,
    });

    if (playRequest !== request) return;
    // WebKit checks user activation at play(), so call it in the gesture handler.
    void media.play().catch((error: unknown) => {
      if (playRequest !== request) return;
      fail(error instanceof DOMException && error.name === "NotAllowedError" ? "playback-blocked" : "media");
    });
  }

  function pause() {
    if (audio === undefined || playRequest === undefined) return;
    cancelPlay();
    audio.pause();
    update({ ...readTimes(audio), status: "paused", interrupted: false });
  }

  function seek(currentTimeMs: number) {
    if (
      audio === undefined ||
      snapshot.durationMs === null ||
      snapshot.status === "loading" ||
      snapshot.status === "error"
    ) {
      return;
    }
    const position = Number.isFinite(currentTimeMs)
      ? Math.max(0, Math.min(currentTimeMs, snapshot.durationMs))
      : null;
    if (position === null) return;
    audio.currentTime = position / 1000;
    update({
      currentTimeMs: position,
      status: snapshot.status === "ended" ? "paused" : snapshot.status,
    });
  }

  function setRate(rate: PlaybackRate) {
    if (snapshot.rate === rate) return;
    if (audio !== undefined) {
      audio.defaultPlaybackRate = rate;
      audio.playbackRate = rate;
    }
    idle = { ...initialSnapshot, rate };
    update({ rate });
  }

  function stop() {
    cancelPlay();
    clip = undefined;
    if (audio?.hasAttribute("src") === true) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    publish(idle);
  }

  function dispose() {
    stop();
    if (audio === undefined) return;
    for (const [event, listener] of Object.entries(mediaEvents)) audio.removeEventListener(event, listener);
    audio = undefined;
  }

  return {
    play,
    pause,
    seek,
    setRate,
    stop,
    dispose,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => snapshot,
    getClipSnapshot: (id: string) => (snapshot.clipId === id ? snapshot : idle),
    getServerSnapshot: () => initialSnapshot,
  };
}
