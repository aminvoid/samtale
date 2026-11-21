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
  chunks(data: string) {
    const event = Object.assign(new Event("dataavailable"), {
      data: new Blob([data], { type: this.mimeType }),
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
});
