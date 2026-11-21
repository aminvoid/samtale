"use client";

export type RecorderErrorCode = "permission-denied" | "unavailable" | "track-ended" | "track-muted";
export type RecorderErrorReason = "in-use" | "insecure" | "other";

export class RecorderError extends Error {
  constructor(
    readonly code: RecorderErrorCode,
    readonly reason: RecorderErrorReason = "other",
  ) {
    super(code);
    this.name = "RecorderError";
  }
}

export type RecorderSignal = { type: "mute" | "ended" | "error"; error: RecorderError } | { type: "unmute" };

export interface RecordedAudio {
  readonly blob: Blob;
  readonly mimeType: string;
  readonly durationMs: number;
}

const formats = ["audio/mp4;codecs=mp4a.40.2", "audio/mp4", "audio/webm;codecs=opus", "audio/webm"];

function supportedFormat() {
  return typeof MediaRecorder !== "undefined" && typeof MediaRecorder.isTypeSupported === "function"
    ? formats.find((format) => MediaRecorder.isTypeSupported(format))
    : undefined;
}

function deviceError(error: unknown): RecorderError {
  const name = typeof error === "object" && error !== null && "name" in error ? error.name : undefined;
  if (name === "NotAllowedError" || name === "PermissionDeniedError")
    return new RecorderError("permission-denied");
  if (name === "NotReadableError" || name === "TrackStartError")
    return new RecorderError("unavailable", "in-use");
  return new RecorderError("unavailable");
}

function createTake(media: MediaRecorder, now: () => number, onFailure: () => void) {
  const chunks: Blob[] = [];
  let durationMs = 0;
  let since: number | null = null;
  let started = false;
  let confirmStart: () => void = () => undefined;
  let rejectStart: (error: RecorderError) => void = () => undefined;
  const activation = new Promise<void>((confirm, reject) => {
    confirmStart = confirm;
    rejectStart = reject;
  });
  let resolve: (recording: RecordedAudio | null) => void = () => undefined;
  const result = new Promise<RecordedAudio | null>((done) => {
    resolve = done;
  });

  function freeze() {
    if (since !== null) durationMs += Math.max(0, now() - since);
    since = null;
  }

  function onData(event: BlobEvent) {
    if (event.data.size > 0) chunks.push(event.data);
  }

  function onStart() {
    started = true;
    confirmStart();
  }

  function finish() {
    freeze();
    media.removeEventListener("start", onStart);
    media.removeEventListener("dataavailable", onData);
    media.removeEventListener("stop", finish);
    media.removeEventListener("error", onError);
    if (!started) rejectStart(new RecorderError("unavailable"));
    const mimeType = chunks.find((chunk) => chunk.type)?.type || media.mimeType;
    resolve(
      started && chunks.length > 0
        ? { blob: new Blob(chunks, { type: mimeType }), mimeType, durationMs }
        : null,
    );
    chunks.length = 0;
  }

  function onError() {
    freeze();
    // MediaRecorder delivers its final data and stop events after an error.
    if (started) onFailure();
    else rejectStart(new RecorderError("unavailable"));
  }

  media.addEventListener("start", onStart, { once: true });
  media.addEventListener("dataavailable", onData);
  media.addEventListener("stop", finish);
  media.addEventListener("error", onError);

  return {
    start(timeslice: number) {
      try {
        media.start(timeslice);
        since = now();
      } catch (error) {
        rejectStart(deviceError(error));
        finish();
      }
      return activation;
    },
    pause() {
      if (media.state === "recording") {
        media.pause();
        freeze();
      }
    },
    resume() {
      if (media.state === "paused") {
        media.resume();
        since = now();
      }
    },
    stop() {
      freeze();
      if (media.state !== "inactive") media.stop();
      return result;
    },
  };
}

/** The caller owns the stream until release and owns the returned Blob after stop. */
export function createRecorder(now = () => performance.now()) {
  let stream: MediaStream | undefined;
  let take: ReturnType<typeof createTake> | undefined;
  let pending: Promise<void> | undefined;
  let generation = 0;
  const listeners = new Set<(signal: RecorderSignal) => void>();

  function emit(signal: RecorderSignal) {
    for (const listener of listeners) listener(signal);
  }

  function mute() {
    emit({ type: "mute", error: new RecorderError("track-muted") });
  }
  function unmute() {
    if (stream?.getAudioTracks().some((track) => track.muted) !== true) emit({ type: "unmute" });
  }
  function ended() {
    emit({ type: "ended", error: new RecorderError("track-ended") });
  }

  function release() {
    generation += 1;
    pending = undefined;
    discard();
    if (stream === undefined) return;
    for (const track of stream.getTracks()) {
      track.removeEventListener("mute", mute);
      track.removeEventListener("unmute", unmute);
      track.removeEventListener("ended", ended);
      track.stop();
    }
    stream = undefined;
    unmute();
  }

  function isAvailable() {
    const tracks = stream?.getAudioTracks() ?? [];
    return tracks.length > 0 && tracks.every((track) => track.readyState === "live" && !track.muted);
  }

  function requestMic(): Promise<void> {
    if (pending !== undefined) return pending;
    if (isAvailable()) return Promise.resolve();
    if (!globalThis.isSecureContext) return Promise.reject(new RecorderError("unavailable", "insecure"));
    if (typeof navigator === "undefined" || supportedFormat() === undefined)
      return Promise.reject(new RecorderError("unavailable"));
    const devices = navigator.mediaDevices;
    if (typeof devices === "undefined" || typeof devices.getUserMedia !== "function")
      return Promise.reject(new RecorderError("unavailable"));
    const obsoleteStream = stream !== undefined;
    if (obsoleteStream) release();
    const request = generation;

    async function acquire() {
      let next: MediaStream;
      try {
        next = await devices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
      } catch (error) {
        throw deviceError(error);
      }
      if (generation !== request) {
        for (const track of next.getTracks()) track.stop();
        throw new RecorderError("unavailable");
      }
      stream = next;
      const tracks = next.getAudioTracks();
      if (tracks.length === 0 || tracks.some((track) => track.readyState === "ended")) {
        release();
        throw new RecorderError("track-ended");
      }
      for (const track of tracks) {
        track.addEventListener("mute", mute);
        track.addEventListener("unmute", unmute);
        track.addEventListener("ended", ended);
      }
      if (tracks.some((track) => track.muted)) mute();
    }

    pending = acquire().finally(() => {
      if (generation === request) pending = undefined;
    });
    return pending;
  }

  function start(timeslice = 1000) {
    if (stream === undefined || take !== undefined) throw new RecorderError("unavailable");
    if (!isAvailable()) {
      const dead = stream.getAudioTracks().some((track) => track.readyState === "ended");
      throw new RecorderError(dead ? "track-ended" : "track-muted");
    }
    const mimeType = supportedFormat();
    if (mimeType === undefined) throw new RecorderError("unavailable");
    let media: MediaRecorder;
    try {
      media = new MediaRecorder(stream, { mimeType });
    } catch (error) {
      throw deviceError(error);
    }
    const next = createTake(media, now, () => {
      if (take === next) emit({ type: "error", error: new RecorderError("unavailable") });
    });
    take = next;
    return next.start(timeslice);
  }

  function stop() {
    const current = take;
    take = undefined;
    return current?.stop() ?? Promise.resolve(null);
  }

  function discard() {
    void stop();
  }

  return {
    requestMic,
    isAvailable,
    start,
    pause: () => take?.pause(),
    resume: () => take?.resume(),
    stop,
    discard,
    release,
    subscribe(listener: (signal: RecorderSignal) => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
