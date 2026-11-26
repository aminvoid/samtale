import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRecorder, type RecorderSignal } from "./index";

class FakeTrack extends EventTarget {
  readyState: MediaStreamTrackState = "live";
  muted = false;
  stop = vi.fn(() => {
    this.readyState = "ended";
  });
}

class FakeMediaRecorder extends EventTarget {
  static supported = "audio/mp4";
  static failStart = false;
  static isTypeSupported = (type: string) => type === FakeMediaRecorder.supported;
  static latest: FakeMediaRecorder | undefined;

  state: RecordingState = "inactive";
  mimeType: string;
  timeslice: number | undefined;

  constructor(_stream: MediaStream, options: MediaRecorderOptions) {
    super();
    this.mimeType = options.mimeType ?? "";
    FakeMediaRecorder.latest = this;
  }

  start(timeslice: number) {
    this.timeslice = timeslice;
    this.state = "recording";
    queueMicrotask(() => {
      if (FakeMediaRecorder.failStart) {
        this.state = "inactive";
        this.dispatchEvent(new Event("error"));
        this.dispatchEvent(new Event("stop"));
      } else {
        this.dispatchEvent(new Event("start"));
      }
    });
  }
  pause() {
    this.state = "paused";
  }
  resume() {
    this.state = "recording";
  }
  chunks(data: string, type = this.mimeType) {
    const event = Object.assign(new Event("dataavailable"), {
      data: new Blob([data], { type }),
    });
    this.dispatchEvent(event);
  }
  stop() {
    this.state = "inactive";
    queueMicrotask(() => {
      this.chunks("final");
      this.dispatchEvent(new Event("stop"));
    });
  }
}

describe("MediaRecorder adapter", () => {
  const getUserMedia = vi.fn<() => Promise<unknown>>();
  let audioTrack: FakeTrack;
  let extraTrack: FakeTrack;

  beforeEach(() => {
    audioTrack = new FakeTrack();
    extraTrack = new FakeTrack();
    getUserMedia.mockReset().mockResolvedValue({
      getTracks: () => [audioTrack, extraTrack],
      getAudioTracks: () => [audioTrack],
    });
    FakeMediaRecorder.latest = undefined;
    FakeMediaRecorder.supported = "audio/mp4";
    FakeMediaRecorder.failStart = false;
    vi.stubGlobal("navigator", { mediaDevices: { getUserMedia } });
    vi.stubGlobal("MediaRecorder", FakeMediaRecorder);
    vi.stubGlobal("isSecureContext", true);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it.each(["audio/mp4", "audio/webm;codecs=opus"])(
    "detects %s and combines chunks across pauses",
    async (mimeType) => {
      FakeMediaRecorder.supported = mimeType;
      let now = 0;
      const recorder = createRecorder(() => now);
      expect(getUserMedia).not.toHaveBeenCalled();
      await recorder.requestMic();
      expect(getUserMedia).toHaveBeenCalledWith({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      await recorder.start(1000);
      expect(FakeMediaRecorder.latest?.timeslice).toBe(1000);
      FakeMediaRecorder.latest?.chunks("first");
      now = 100;
      recorder.pause();
      now = 1000;
      recorder.resume();
      now = 1200;
      const result = recorder.stop();
      recorder.release();
      expect(audioTrack.stop).toHaveBeenCalledOnce();
      expect(extraTrack.stop).toHaveBeenCalledOnce();
      const recording = await result;
      expect(recording).toMatchObject({ mimeType, durationMs: 300 });
      expect(recording?.blob).toMatchObject({ size: 10, type: mimeType });
    },
  );

  it("types permission denial, unavailable devices and track signals", async () => {
    getUserMedia
      .mockRejectedValueOnce(new DOMException("", "NotAllowedError"))
      .mockRejectedValueOnce(new DOMException("", "NotReadableError"));
    const recorder = createRecorder();
    const listener = vi.fn<(signal: RecorderSignal) => void>();
    recorder.subscribe(listener);
    await expect(recorder.requestMic()).rejects.toMatchObject({ code: "permission-denied" });
    await expect(recorder.requestMic()).rejects.toMatchObject({ code: "unavailable", reason: "in-use" });
    await recorder.requestMic();
    audioTrack.muted = true;
    audioTrack.dispatchEvent(new Event("mute"));
    audioTrack.muted = false;
    audioTrack.dispatchEvent(new Event("unmute"));
    audioTrack.dispatchEvent(new Event("ended"));
    expect(listener.mock.calls[0]?.[0]).toMatchObject({ type: "mute", error: { code: "track-muted" } });
    expect(listener.mock.calls[1]?.[0]).toEqual({ type: "unmute" });
    expect(listener.mock.calls[2]?.[0]).toMatchObject({ type: "ended", error: { code: "track-ended" } });
    recorder.release();
    audioTrack.dispatchEvent(new Event("ended"));
    expect(listener).toHaveBeenCalledTimes(4);
  });

  it("stops a permission request that resolves after release", async () => {
    const late = Promise.withResolvers<unknown>();
    getUserMedia.mockReturnValueOnce(late.promise);
    const recorder = createRecorder();
    const request = recorder.requestMic();
    recorder.release();
    late.resolve({ getTracks: () => [audioTrack, extraTrack] });
    await expect(request).rejects.toMatchObject({ code: "unavailable" });
    expect(audioTrack.stop).toHaveBeenCalledOnce();
    expect(extraTrack.stop).toHaveBeenCalledOnce();
  });

  it("discards a take while keeping the stream available for a new one", async () => {
    const recorder = createRecorder();
    await recorder.requestMic();
    await recorder.start();
    recorder.discard();
    expect(await recorder.stop()).toBeNull();
    expect(recorder.isAvailable()).toBe(true);
    await recorder.start();
    expect(await recorder.stop()).toMatchObject({ mimeType: "audio/mp4" });
    recorder.release();
  });

  it("resolves a stopped take to null when the recorder never delivers its stop event", async () => {
    vi.useFakeTimers();
    const recorder = createRecorder(() => 0, 250);
    await recorder.requestMic();
    await recorder.start();
    const media = FakeMediaRecorder.latest;
    if (!media) throw new Error("Expected a recorder");
    media.chunks("partial");
    media.state = "inactive";
    const settled = vi.fn();
    const result = recorder.stop().then(settled);
    recorder.release();

    await vi.advanceTimersByTimeAsync(249);
    expect(settled).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    await result;
    expect(settled).toHaveBeenCalledExactlyOnceWith(null);
    expect(audioTrack.stop).toHaveBeenCalledOnce();
  });

  it("reports an encoder startup failure before confirming a recording", async () => {
    FakeMediaRecorder.failStart = true;
    const recorder = createRecorder();
    const signal = vi.fn();
    recorder.subscribe(signal);
    await recorder.requestMic();
    await expect(recorder.start()).rejects.toMatchObject({ code: "unavailable" });
    expect(await recorder.stop()).toBeNull();
    expect(signal).not.toHaveBeenCalled();
    recorder.release();
  });

  it("reports missing formats and an insecure context without prompting", async () => {
    const recorder = createRecorder();
    FakeMediaRecorder.supported = "";
    await expect(recorder.requestMic()).rejects.toMatchObject({ code: "unavailable" });
    vi.stubGlobal("isSecureContext", false);
    await expect(recorder.requestMic()).rejects.toMatchObject({ code: "unavailable", reason: "insecure" });
    expect(getUserMedia).not.toHaveBeenCalled();
  });

  it.each([
    { name: "MediaRecorder", recorder: undefined, navigator: { mediaDevices: { getUserMedia } } },
    {
      name: "format detection",
      recorder: FakeMediaRecorder.bind(null),
      navigator: { mediaDevices: { getUserMedia } },
    },
    { name: "navigator", recorder: FakeMediaRecorder, navigator: undefined },
    { name: "mediaDevices", recorder: FakeMediaRecorder, navigator: {} },
    { name: "getUserMedia", recorder: FakeMediaRecorder, navigator: { mediaDevices: {} } },
  ])("reports unavailable recording without $name", async ({ recorder, navigator }) => {
    vi.stubGlobal("MediaRecorder", recorder);
    vi.stubGlobal("navigator", navigator);
    await expect(createRecorder().requestMic()).rejects.toMatchObject({ code: "unavailable" });
    expect(getUserMedia).not.toHaveBeenCalled();
  });

  it.each([
    [new DOMException("", "PermissionDeniedError"), "permission-denied", "other"],
    [new DOMException("", "TrackStartError"), "unavailable", "in-use"],
    [new DOMException("", "NotFoundError"), "unavailable", "other"],
    [undefined, "unavailable", "other"],
  ])("normalizes microphone rejection %s", async (error, code, reason) => {
    getUserMedia.mockRejectedValueOnce(error);
    await expect(createRecorder().requestMic()).rejects.toMatchObject({ code, reason });
  });

  it("shares a pending permission prompt and replaces an unusable stream on the next request", async () => {
    const recorder = createRecorder();
    await Promise.all([recorder.requestMic(), recorder.requestMic()]);
    await recorder.requestMic();
    expect(getUserMedia).toHaveBeenCalledOnce();

    audioTrack.muted = true;
    expect(() => recorder.start()).toThrow(expect.objectContaining({ code: "track-muted" }));
    audioTrack.readyState = "ended";
    expect(() => recorder.start()).toThrow(expect.objectContaining({ code: "track-ended" }));

    const replacement = new FakeTrack();
    getUserMedia.mockResolvedValueOnce({
      getTracks: () => [replacement],
      getAudioTracks: () => [replacement],
    });
    await recorder.requestMic();
    expect(audioTrack.stop).toHaveBeenCalledOnce();
    expect(recorder.isAvailable()).toBe(true);
    recorder.release();
    expect(replacement.stop).toHaveBeenCalledOnce();
  });

  it.each(["no audio tracks", "an already ended track"])(
    "rejects and releases a stream with %s",
    async (kind) => {
      audioTrack.readyState = "ended";
      getUserMedia.mockResolvedValueOnce({
        getTracks: () => [audioTrack, extraTrack],
        getAudioTracks: () => (kind === "no audio tracks" ? [] : [audioTrack]),
      });
      const recorder = createRecorder();
      await expect(recorder.requestMic()).rejects.toMatchObject({ code: "track-ended" });
      expect(recorder.isAvailable()).toBe(false);
      expect(extraTrack.stop).toHaveBeenCalledOnce();
    },
  );

  it("keeps the stream muted until its last muted track recovers", async () => {
    audioTrack.muted = extraTrack.muted = true;
    getUserMedia.mockResolvedValueOnce({
      getTracks: () => [audioTrack, extraTrack],
      getAudioTracks: () => [audioTrack, extraTrack],
    });
    const recorder = createRecorder();
    const listener = vi.fn<(signal: RecorderSignal) => void>();
    const unsubscribe = recorder.subscribe(listener);
    await recorder.requestMic();
    expect(listener).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ type: "mute" }));
    audioTrack.muted = false;
    audioTrack.dispatchEvent(new Event("unmute"));
    expect(listener).toHaveBeenCalledTimes(1);
    extraTrack.muted = false;
    extraTrack.dispatchEvent(new Event("unmute"));
    expect(listener).toHaveBeenLastCalledWith({ type: "unmute" });
    expect(recorder.isAvailable()).toBe(true);
    unsubscribe();
    recorder.release();
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("can retry after encoder support changes or the browser rejects recorder creation", async () => {
    const recorder = createRecorder();
    expect(() => recorder.start()).toThrow(expect.objectContaining({ code: "unavailable" }));
    await recorder.requestMic();
    FakeMediaRecorder.supported = "";
    expect(() => recorder.start()).toThrow(expect.objectContaining({ code: "unavailable" }));

    FakeMediaRecorder.supported = "audio/mp4";
    vi.stubGlobal(
      "MediaRecorder",
      class extends FakeMediaRecorder {
        constructor(stream: MediaStream, options: MediaRecorderOptions) {
          super(stream, options);
          throw new DOMException("", "NotReadableError");
        }
      },
    );
    expect(() => recorder.start()).toThrow(
      expect.objectContaining({ code: "unavailable", reason: "in-use" }),
    );
    vi.stubGlobal("MediaRecorder", FakeMediaRecorder);
    await recorder.start();
    expect(() => recorder.start()).toThrow(expect.objectContaining({ code: "unavailable" }));
    await recorder.stop();
    recorder.release();
  });

  it("keeps the audio collected before an encoder error and excludes time after the error", async () => {
    let now = 0;
    const recorder = createRecorder(() => now);
    const listener = vi.fn<(signal: RecorderSignal) => void>();
    recorder.subscribe(listener);
    await recorder.requestMic();
    recorder.pause();
    recorder.resume();
    await recorder.start();
    const media = FakeMediaRecorder.latest;
    if (!media) throw new Error("Expected a recorder");
    recorder.resume();
    media.chunks("");
    now = 120;
    media.chunks("partial", "");
    media.state = "inactive";
    media.dispatchEvent(new Event("error"));
    expect(listener).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ type: "error" }));

    now = 500;
    media.dispatchEvent(new Event("stop"));
    expect(await recorder.stop()).toMatchObject({
      mimeType: "audio/mp4",
      durationMs: 120,
      blob: { size: 7, type: "audio/mp4" },
    });
    recorder.release();
  });
});
