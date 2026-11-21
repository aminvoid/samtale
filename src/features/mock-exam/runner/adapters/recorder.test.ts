import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { createRecorderPort } from "./recorder";

const native = vi.hoisted(() => {
  let streamOpen = false;
  return {
    requestMic: vi.fn(() => {
      streamOpen = true;
      return Promise.resolve();
    }),
    start: vi.fn(() => Promise.resolve()),
    stop: vi.fn(() => Promise.resolve(null)),
    release: vi.fn(() => {
      streamOpen = false;
    }),
    subscribe: vi.fn(),
    isAvailable: () => streamOpen,
  };
});

vi.mock("@/lib/audio/recorder", () => ({ createRecorder: () => native }));

const query = vi.fn<() => Promise<{ state: PermissionState }>>();

beforeEach(() => {
  native.release();
  vi.clearAllMocks();
  query.mockReset().mockResolvedValue({ state: "granted" });
  vi.stubGlobal("navigator", { permissions: { query } });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

it("holds the stream between answers in keep-open mode", async () => {
  const port = createRecorderPort("keep-open");
  expect(await port.requestMic("permission")).toEqual({ type: "granted" });
  await port.start(1000);
  await port.stop();
  await port.start(1000);
  expect(native.requestMic).toHaveBeenCalledOnce();
  expect(native.release).not.toHaveBeenCalled();
  port.release();
  expect(native.release).toHaveBeenCalledOnce();
});

it("reopens before each answer when per-answer permission is confirmed", async () => {
  const port = createRecorderPort("per-answer");
  expect(await port.requestMic("permission")).toEqual({ type: "granted" });
  expect(native.release).toHaveBeenCalledOnce();
  await port.start(1000);
  await port.stop();
  await port.start(1000);
  await port.stop();
  expect(native.requestMic).toHaveBeenCalledTimes(3);
  expect(native.release).toHaveBeenCalledTimes(3);
  expect(query).toHaveBeenCalledTimes(2);
});

it("avoids a second prompt when the existing grant cannot be confirmed", async () => {
  const port = createRecorderPort("per-answer");
  await port.requestMic("permission");
  query.mockResolvedValueOnce({ state: "prompt" }).mockRejectedValueOnce(new Error("Unsupported permission"));
  await expect(port.start(1000)).rejects.toThrow("Microphone unavailable");
  expect(await port.requestMic("check-grant")).toEqual({ type: "denied", reason: "other" });
  expect(native.requestMic).toHaveBeenCalledOnce();
  expect(native.start).not.toHaveBeenCalled();
});
