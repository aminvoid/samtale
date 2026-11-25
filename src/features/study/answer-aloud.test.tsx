import { act, cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../messages/fa.json";
import { AudioPlayerProvider } from "@/lib/audio/player";
import { examConfig } from "@/lib/exam/config";
import { renderWithIntl } from "@/test/render-with-intl";
import { AnswerAloud, AnswerAloudProvider } from "./answer-aloud";
import type { SpeakingQuestion } from "./answer-aloud-panel";
import { getStudyProgressStore } from "./study-progress-store";

vi.mock("@/i18n/navigation", () => ({
  Link: (props: React.ComponentProps<"a">) => <a {...props} />,
}));

const { study, mock } = messages;
const { speaking } = study;
const recordingCapMs = examConfig.maxRecordingSeconds * 1000;
const topicId = "2024-maj-b";
const question: SpeakingQuestion = {
  id: `${topicId}.sitA.q1`,
  role: "first-question",
  situation: "A",
  text: { da: "Hvorfor tror du det?", fa: "به نظرتان چرا؟" },
  audio: { url: "/audio/examiner.mp3", durationMs: 2000 },
  keywords: [{ id: "keyword", emoji: "💬", text: { da: "arbejde", fa: "کار" } }],
  model: {
    id: `${topicId}.sitA.q1.answer`,
    text: { da: "Der er flere grunde." },
    emphasis: [],
    audio: { url: "/audio/model.mp3", durationMs: 3000 },
  },
};
const followup: SpeakingQuestion = {
  id: `${topicId}.sitA.followup1`,
  role: "followup",
  text: { da: "Hvad mener du?", fa: "نظر شما چیست؟" },
  audio: { url: "/audio/followup.mp3", durationMs: 1000 },
  model: { ...question.model, id: `${topicId}.sitA.followup1.answer` },
};

class TestTrack extends EventTarget {
  readyState: MediaStreamTrackState = "live";
  muted = false;
  stop = vi.fn(() => {
    this.readyState = "ended";
  });

  setMuted(muted: boolean) {
    this.muted = muted;
    this.dispatchEvent(new Event(muted ? "mute" : "unmute"));
  }
}

class TestMediaRecorder extends EventTarget {
  static isTypeSupported = (type: string) => type === "audio/webm";
  state: RecordingState = "inactive";

  start() {
    this.state = "recording";
    this.dispatchEvent(new Event("start"));
  }

  stop() {
    this.state = "inactive";
    queueMicrotask(() => {
      this.dispatchEvent(
        Object.assign(new Event("dataavailable"), {
          data: new Blob(["test take"], { type: "audio/webm" }),
        }),
      );
      this.dispatchEvent(new Event("stop"));
    });
  }

  pause() {
    this.state = "paused";
  }

  resume() {
    this.state = "recording";
  }
}

describe("answer aloud", () => {
  const store = getStudyProgressStore();
  let tracks: TestTrack[];
  let media: HTMLMediaElement | undefined;
  let ended: boolean;
  let paused: boolean;
  let getUserMedia: ReturnType<typeof vi.fn<() => Promise<unknown>>>;
  const createUrl = vi.fn<(blob: Blob) => string>();
  const revokeUrl = vi.fn<(url: string) => void>();
  let originalDevices: PropertyDescriptor | undefined;
  let originalWakeLock: PropertyDescriptor | undefined;
  let originalActivation: PropertyDescriptor | undefined;
  let originalPermissions: PropertyDescriptor | undefined;
  const release = vi.fn<() => Promise<void>>();
  const wakeLock = vi.fn<() => Promise<unknown>>();

  beforeEach(async () => {
    await store.clearAll();
    window.history.replaceState(null, "");
    tracks = [];
    media = undefined;
    ended = false;
    paused = true;
    vi.stubGlobal("isSecureContext", true);
    vi.stubGlobal("MediaRecorder", TestMediaRecorder);

    originalDevices = Object.getOwnPropertyDescriptor(navigator, "mediaDevices");
    originalWakeLock = Object.getOwnPropertyDescriptor(navigator, "wakeLock");
    originalActivation = Object.getOwnPropertyDescriptor(navigator, "userActivation");
    originalPermissions = Object.getOwnPropertyDescriptor(navigator, "permissions");
    getUserMedia = vi.fn(() => Promise.resolve(makeStream()));
    Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia } });
    release.mockReset().mockResolvedValue(undefined);
    wakeLock.mockReset().mockResolvedValue(Object.assign(new EventTarget(), { released: false, release }));
    Object.defineProperty(navigator, "wakeLock", { configurable: true, value: { request: wakeLock } });

    vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(function (this: HTMLMediaElement) {
      // Keep the actual element so assertions can verify that all clips share it.
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      media = this;
      ended = false;
      paused = false;
      this.dispatchEvent(new Event("playing"));
      return Promise.resolve();
    });
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {
      paused = true;
    });
    vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => undefined);
    vi.spyOn(HTMLMediaElement.prototype, "paused", "get").mockImplementation(() => paused);
    vi.spyOn(HTMLMediaElement.prototype, "ended", "get").mockImplementation(() => ended);
    let urlId = 0;
    createUrl.mockReset().mockImplementation(() => `blob:take-${String(++urlId)}`);
    revokeUrl.mockReset();
    vi.stubGlobal(
      "URL",
      Object.assign(class extends URL {}, {
        createObjectURL: createUrl,
        revokeObjectURL: revokeUrl,
      }),
    );
  });

  afterEach(() => {
    cleanup();
    if (originalDevices === undefined) Reflect.deleteProperty(navigator, "mediaDevices");
    else Object.defineProperty(navigator, "mediaDevices", originalDevices);
    if (originalWakeLock === undefined) Reflect.deleteProperty(navigator, "wakeLock");
    else Object.defineProperty(navigator, "wakeLock", originalWakeLock);
    if (originalActivation === undefined) Reflect.deleteProperty(navigator, "userActivation");
    else Object.defineProperty(navigator, "userActivation", originalActivation);
    if (originalPermissions === undefined) Reflect.deleteProperty(navigator, "permissions");
    else Object.defineProperty(navigator, "permissions", originalPermissions);
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  function makeStream(track = new TestTrack()) {
    tracks.push(track);
    return { getTracks: () => [track], getAudioTracks: () => [track] };
  }

  function renderExercise(questions = [question, followup]) {
    const view = renderWithIntl(
      <AudioPlayerProvider>
        <AnswerAloudProvider topicId={topicId} questions={questions}>
          <AnswerAloud itemId={questions[0]?.id ?? question.id} primary />
        </AnswerAloudProvider>
      </AudioPlayerProvider>,
    );
    const user = userEvent.setup();
    const entry = screen.getByRole("button", { name: study.answerAloud });
    return { ...view, user, entry };
  }

  function endQuestion() {
    act(() => {
      ended = true;
      paused = true;
      media?.dispatchEvent(new Event("ended"));
    });
  }

  async function record(withClock = false) {
    endQuestion();
    const allow = await allowMic();
    if (withClock) installClock();
    await act(() => {
      fireEvent.click(allow);
      return Promise.resolve();
    });
    expect(screen.getByText(speaking.recording, { exact: true })).toBeVisible();
  }

  async function allowMic() {
    const allow = await screen.findByRole("button", { name: mock.ready.micAllow });
    await waitFor(() => {
      expect(allow).toBeEnabled();
    });
    return allow;
  }

  const button = (name: string) => screen.getByRole("button", { name });
  const dialog = () => within(screen.getByRole("dialog", { name: study.answerAloud }));
  const currentSrc = () => media?.getAttribute("src");
  const timer = () => dialog().getByRole("timer", { name: speaking.elapsed });

  function installClock() {
    vi.useFakeTimers({
      toFake: ["performance", "setTimeout", "clearTimeout", "setInterval", "clearInterval"],
    });
  }

  async function advance(ms: number) {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(ms);
    });
  }

  function stubHistory() {
    const topicState = { __NA: true, __PRIVATE_NEXTJS_INTERNALS_TREE: { tree: ["topic"] }, custom: "keep" };
    const entries: unknown[] = [topicState];
    const reload = vi.fn();
    let position = 0;

    function traverse(offset: number) {
      const target = position + offset;
      if (target < 0 || target >= entries.length) return;
      position = target;
      const state = entries[position];
      window.dispatchEvent(new PopStateEvent("popstate", { state }));
      // The App Router reloads a history entry from outside its router.
      if (typeof state === "object" && state !== null && !("__NA" in state && state.__NA)) reload();
    }

    const current = () => entries[position];
    vi.spyOn(window.history, "state", "get").mockImplementation(current);
    vi.spyOn(window.history, "pushState").mockImplementation((state: unknown) => {
      entries.splice(++position, entries.length, structuredClone(state));
    });
    vi.spyOn(window.history, "back").mockImplementation(() => {
      traverse(-1);
    });
    vi.spyOn(window.history, "forward").mockImplementation(() => {
      traverse(1);
    });
    return { current, reload, topicState };
  }

  it("plays the question from the keyboard, explains permission first, and announces timed recording", async () => {
    const { user, entry } = renderExercise();
    expect(getUserMedia).not.toHaveBeenCalled();
    expect(media).toBeUndefined();
    entry.focus();
    await user.keyboard("{Enter}");

    expect(currentSrc()).toBe(question.audio?.url);
    expect(dialog().getByText(speaking.privacy)).toBeVisible();
    expect(dialog().getByText(question.text.da)).toHaveAttribute("lang", "da");
    expect(dialog().getByText(question.text.da)).toHaveAttribute("dir", "ltr");
    expect(dialog().queryByText(question.model.text.da)).not.toBeInTheDocument();
    expect(dialog().queryByText(question.text.fa)).not.toBeInTheDocument();
    expect(dialog().queryByRole("button", { name: speaking.next })).not.toBeInTheDocument();
    expect(getUserMedia).not.toHaveBeenCalled();

    vi.useFakeTimers({ toFake: ["performance", "setInterval", "clearInterval"] });
    await record();
    expect(getUserMedia).toHaveBeenCalledOnce();
    expect(dialog().getByText(speaking.recording).closest("[role=status]")).not.toBeNull();
    expect(button(study.answerDone)).toHaveFocus();
    expect(wakeLock).toHaveBeenCalledWith("screen");
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(dialog().getByRole("timer", { name: speaking.elapsed })).toHaveTextContent("۰:۰۲");
    expect(dialog().getByText("۰:۰۲")).not.toHaveAttribute("aria-live");
    fireEvent.click(button(speaking.hideQuestion));
    expect(dialog().getByText(question.text.da)).not.toBeVisible();
    fireEvent.click(button(speaking.hint));
    expect(dialog().getByText("arbejde")).toBeVisible();
  });

  it("compares before a separate Next action, uses one player, and saves practice once", async () => {
    const { user, entry } = renderExercise();
    await user.click(entry);
    await record();
    const sharedMedia = media;
    expect(await store.listPracticeEvents({ topicId })).toEqual({ ok: true, value: [] });
    await user.keyboard("{Enter}");

    const take = await screen.findByRole("button", { name: speaking.playTake });
    expect(take).toHaveFocus();
    expect(button(speaking.next)).toBeVisible();
    expect(dialog().queryByRole("button", { name: study.answerDone })).not.toBeInTheDocument();
    expect(dialog().getByText(question.model.text.da)).toBeVisible();
    expect(tracks[0]?.stop).toHaveBeenCalledOnce();
    expect(release).toHaveBeenCalledOnce();
    expect(createUrl).toHaveBeenCalledWith(expect.any(Blob));
    await user.keyboard(" ");
    expect(take).toHaveAttribute("aria-pressed", "true");
    expect(currentSrc()).toBe("blob:take-1");
    expect(media).toBe(sharedMedia);
    const model = button(study.playSample);
    await user.click(model);
    expect(model).toHaveAttribute("aria-pressed", "true");
    expect(take).toHaveAttribute("aria-pressed", "false");
    expect(media).toBe(sharedMedia);
    expect(currentSrc()).toBe(question.model.audio?.url);
    expect(await screen.findByText(study.practiceSaved)).toBeVisible();
    expect(await store.listPracticeEvents({ topicId })).toMatchObject({
      ok: true,
      value: [{ topicId, itemId: question.id, kind: "answer-aloud" }],
    });

    await user.click(button(speaking.next));
    expect(currentSrc()).toBe(followup.audio?.url);
    expect(dialog().getByText(followup.text.da)).toBeVisible();
    expect(revokeUrl).toHaveBeenCalledWith("blob:take-1");
    expect(dialog().queryByRole("button", { name: speaking.next })).not.toBeInTheDocument();
    endQuestion();
    await screen.findByText(speaking.recording);
    await user.click(button(study.answerDone));
    expect(await screen.findByRole("button", { name: speaking.back })).toBeVisible();
    expect(button(study.playShortAnswer)).toBeVisible();
  });

  it("requests the mic within Allow, Record again, and Next taps and waits for the examiner before recording", async () => {
    let inTap = false;
    Object.defineProperty(navigator, "userActivation", {
      configurable: true,
      value: {
        get isActive() {
          return inTap;
        },
      },
    });
    getUserMedia.mockImplementation(() =>
      inTap
        ? Promise.resolve(makeStream())
        : Promise.reject(new DOMException("No activation", "NotAllowedError")),
    );
    const startRecording = vi.spyOn(TestMediaRecorder.prototype, "start");
    const { entry } = renderExercise();
    fireEvent.click(entry);
    expect(dialog().getByText(speaking.privacy)).toBeVisible();
    expect(getUserMedia).not.toHaveBeenCalled();
    endQuestion();

    function tap(control: HTMLElement, count: number) {
      inTap = true;
      try {
        fireEvent.click(control);
        expect(getUserMedia).toHaveBeenCalledTimes(count);
      } finally {
        inTap = false;
      }
    }

    tap(await allowMic(), 1);
    await screen.findByText(speaking.recording, { exact: true });
    expect(startRecording).toHaveBeenCalledOnce();

    for (const [index, label] of [speaking.again, speaking.next].entries()) {
      fireEvent.click(button(study.answerDone));
      await screen.findByRole("button", { name: speaking.playTake });
      await act(() => {
        tap(button(label), index + 2);
        return Promise.resolve();
      });
      expect(dialog().getByText(speaking.listening)).toBeVisible();
      expect(startRecording).toHaveBeenCalledTimes(index + 1);
      endQuestion();
      await screen.findByText(speaking.recording, { exact: true });
      expect(startRecording).toHaveBeenCalledTimes(index + 2);
    }
  });

  it("stops at the recording cap and opens comparison without advancing", async () => {
    const { user, entry } = renderExercise();
    await user.click(entry);
    await record(true);
    await advance(recordingCapMs - 1);
    expect(button(study.answerDone)).toBeVisible();
    expect(tracks[0]?.stop).not.toHaveBeenCalled();
    await advance(1);
    expect(tracks[0]?.stop).toHaveBeenCalledOnce();
    expect(button(speaking.playTake)).toHaveFocus();
    expect(button(speaking.next)).toBeVisible();
    expect(dialog().getByText(/ضبط پس از/)).toBeVisible();
    vi.useRealTimers();
    expect(await screen.findByText(study.practiceSaved)).toBeVisible();
  });

  it("replaces a take and discards it on confirmed close", async () => {
    const save = vi.spyOn(store, "recordPractice");
    const { user, entry } = renderExercise();
    await user.click(entry);
    await record();
    await user.click(button(study.answerDone));
    await screen.findByText(study.practiceSaved);
    await user.click(button(speaking.playTake));
    await user.click(button(speaking.again));
    expect(revokeUrl).toHaveBeenCalledWith("blob:take-1");
    expect(currentSrc()).toBe(question.audio?.url);
    endQuestion();
    await screen.findByText(speaking.recording);
    await user.click(button(study.answerDone));
    await screen.findByRole("button", { name: speaking.playTake });
    await user.click(button(speaking.playTake));
    expect(currentSrc()).toBe("blob:take-2");

    await user.keyboard("{Escape}");
    const guard = screen.getByRole("dialog", { name: speaking.discardTitle });
    expect(within(guard).getByText(speaking.discard)).toBeVisible();
    await waitFor(() => {
      expect(within(guard).getByRole("button", { name: speaking.stay })).toHaveFocus();
    });
    expect(revokeUrl).not.toHaveBeenCalledWith("blob:take-2");
    await user.click(within(guard).getByRole("button", { name: speaking.stay }));
    await waitFor(() => {
      expect(button(speaking.playTake)).toHaveFocus();
    });
    await user.keyboard("{Escape}");
    await user.click(button(speaking.leave));
    await waitFor(() => {
      expect(entry).toHaveFocus();
    });
    expect(revokeUrl).toHaveBeenCalledWith("blob:take-2");
    expect(currentSrc()).toBeNull();
    expect(save).toHaveBeenCalledOnce();
    expect(await store.listPracticeEvents({ topicId })).toMatchObject({
      ok: true,
      value: [{ itemId: question.id }],
    });
  });

  it.each(["denied", "missing", "unsupported", "in-use"] as const)(
    "continues without recording when the microphone is %s, with a retry",
    async (failure) => {
      const { user, entry } = renderExercise();
      if (failure === "unsupported") vi.stubGlobal("MediaRecorder", undefined);
      else
        getUserMedia.mockRejectedValue(
          new DOMException(
            "test",
            {
              denied: "NotAllowedError",
              missing: "NotFoundError",
              "in-use": "NotReadableError",
            }[failure],
          ),
        );
      await user.click(entry);
      endQuestion();
      await user.click(await allowMic());
      expect(await screen.findByText(speaking.withoutRecording)).toBeVisible();
      expect(
        dialog().getByText(
          failure === "denied"
            ? speaking.micDenied
            : failure === "in-use"
              ? mock.ready.micInUse
              : mock.ready.micUnavailable,
        ),
      ).toBeVisible();
      if (failure === "unsupported") expect(getUserMedia).not.toHaveBeenCalled();
      if (failure === "denied") expect(dialog().getByText(speaking.micSettings)).toBeVisible();
      expect(button(speaking.micRetry)).toBeVisible();
      await user.click(button(study.answerDone));
      const sample = await screen.findByRole("button", { name: study.playSample });
      expect(sample).toHaveFocus();
      expect(dialog().getByText(speaking.noTake)).toBeVisible();
      expect(dialog().getByText(question.model.text.da)).toBeVisible();
      expect(await screen.findByText(study.practiceSaved)).toBeVisible();
      expect(await store.listPracticeEvents({ topicId })).toMatchObject({
        ok: true,
        value: [{ itemId: question.id, kind: "answer-aloud" }],
      });
      expect(createUrl).not.toHaveBeenCalled();
    },
  );

  it("shows guidance without asking again after denial and allows an explicit retry", async () => {
    getUserMedia.mockRejectedValueOnce(new DOMException("test", "NotAllowedError"));
    const { user, entry } = renderExercise();
    await user.click(entry);
    endQuestion();
    await user.click(await allowMic());
    await screen.findByText(speaking.micDenied);
    await user.click(button(study.answerDone));
    await screen.findByText(study.practiceSaved);
    await user.click(button(speaking.again));
    endQuestion();
    await screen.findByText(speaking.micDenied);
    expect(getUserMedia).toHaveBeenCalledOnce();
    await user.click(button(speaking.micRetry));
    await screen.findByText(speaking.recording);
    expect(getUserMedia).toHaveBeenCalledTimes(2);
  });

  it.each(["prompt", "denied"] as const)(
    "checks the Permissions API before remembering NotAllowedError without activation (%s)",
    async (permission) => {
      const activation = { isActive: false };
      Object.defineProperty(navigator, "userActivation", { configurable: true, value: activation });
      const query = vi.fn().mockResolvedValue({ state: permission });
      Object.defineProperty(navigator, "permissions", { configurable: true, value: { query } });
      const update = vi.spyOn(store, "updateSettings");
      getUserMedia.mockRejectedValueOnce(new DOMException("test", "NotAllowedError"));
      const { entry } = renderExercise();
      fireEvent.click(entry);
      endQuestion();
      fireEvent.click(await allowMic());
      const denied = permission === "denied";
      expect(await screen.findByText(denied ? speaking.micDenied : mock.ready.micUnavailable)).toBeVisible();
      expect(query).toHaveBeenCalledWith({ name: "microphone" });
      if (denied) expect(update).toHaveBeenCalledWith(expect.objectContaining({ micDenied: true }));
      else expect(update).not.toHaveBeenCalled();

      activation.isActive = true;
      fireEvent.click(button(speaking.micRetry));
      expect(await screen.findByText(speaking.recording, { exact: true })).toBeVisible();
      expect(getUserMedia).toHaveBeenCalledTimes(2);
    },
  );

  it("keeps retries available when MediaRecorder.start throws NotAllowedError after acquisition", async () => {
    vi.spyOn(TestMediaRecorder.prototype, "start").mockImplementationOnce(() => {
      throw new DOMException("test", "NotAllowedError");
    });
    const update = vi.spyOn(store, "updateSettings");
    const { entry } = renderExercise();
    fireEvent.click(entry);
    endQuestion();
    fireEvent.click(await allowMic());
    expect(await screen.findByText(mock.ready.micUnavailable)).toBeVisible();
    expect(update).not.toHaveBeenCalledWith(expect.objectContaining({ micDenied: true }));
    expect(tracks[0]?.stop).toHaveBeenCalledOnce();
    fireEvent.click(button(speaking.micRetry));
    expect(await screen.findByText(speaking.recording, { exact: true })).toBeVisible();
  });

  it("offers the unsupported wake-lock tip once and leaves recording usable", async () => {
    wakeLock.mockRejectedValue(new DOMException("test", "NotAllowedError"));
    const { user, entry } = renderExercise();
    await user.click(entry);
    await record();
    const dismiss = await screen.findByRole("button", { name: speaking.dismissWakeLockTip });
    await user.click(dismiss);
    expect(dialog().queryByRole("button", { name: speaking.dismissWakeLockTip })).not.toBeInTheDocument();
    await user.click(button(study.answerDone));
    await screen.findByText(study.practiceSaved);
    await user.click(button(speaking.again));
    endQuestion();
    await screen.findByText(speaking.recording);
    expect(dialog().queryByRole("button", { name: speaking.dismissWakeLockTip })).not.toBeInTheDocument();
  });

  it("protects the in-progress take if the learner closes during a repeat", async () => {
    const { user, entry } = renderExercise();
    await user.click(entry);
    await record();
    await user.click(button(mock.interview.repeat));
    expect(dialog().getByText(speaking.listening)).toBeVisible();
    await user.keyboard("{Escape}");
    expect(await screen.findByRole("dialog", { name: speaking.discardTitle })).toBeVisible();
    await user.click(button(speaking.stay));
    expect(await screen.findByText(speaking.paused)).toBeVisible();
    expect(tracks[0]?.stop).toHaveBeenCalledOnce();
    expect(await store.listPracticeEvents({ topicId })).toEqual({ ok: true, value: [] });
    await user.click(button(study.answerDone));
    expect(await screen.findByRole("button", { name: speaking.playTake })).toHaveFocus();
    await screen.findByText(study.practiceSaved);
  });

  it("keeps recording through a short mic mute and pauses on sustained mute", async () => {
    const { entry } = renderExercise();
    fireEvent.click(entry);
    await record(true);
    act(() => {
      tracks[0]?.setMuted(true);
    });
    await advance(examConfig.micMuteInterruptMs - 1);
    act(() => {
      tracks[0]?.setMuted(false);
    });
    await advance(examConfig.micMuteInterruptMs);
    expect(dialog().getByText(speaking.recording, { exact: true })).toBeVisible();
    expect(tracks[0]?.stop).not.toHaveBeenCalled();

    act(() => {
      tracks[0]?.setMuted(true);
    });
    await advance(examConfig.micMuteInterruptMs - 1);
    expect(tracks[0]?.stop).not.toHaveBeenCalled();
    await advance(1);
    expect(dialog().getByText(speaking.paused)).toBeVisible();
    expect(tracks[0]?.stop).toHaveBeenCalledOnce();
    expect(await store.listPracticeEvents({ topicId })).toEqual({ ok: true, value: [] });
  });

  it("lets examiner playback finish when the track mutes during a repeat", async () => {
    const { entry } = renderExercise();
    fireEvent.click(entry);
    await record(true);
    fireEvent.click(button(mock.interview.repeat));
    act(() => {
      tracks[0]?.setMuted(true);
    });
    await advance(examConfig.micMuteInterruptMs * 2);
    expect(dialog().getByText(speaking.listening)).toBeVisible();
    expect(currentSrc()).toBe(question.audio?.url);
    expect(tracks[0]?.stop).not.toHaveBeenCalled();

    endQuestion();
    await advance(examConfig.micMuteInterruptMs - 1);
    expect(dialog().getByText(speaking.recording, { exact: true })).toBeVisible();
    await advance(1);
    expect(dialog().getByText(speaking.paused)).toBeVisible();
    expect(tracks[0]?.stop).toHaveBeenCalledOnce();
  });

  it.each(["ended", "error"])("pauses immediately on a microphone %s signal", async (signal) => {
    const start = vi.spyOn(TestMediaRecorder.prototype, "start");
    const { entry } = renderExercise();
    fireEvent.click(entry);
    await record(true);
    act(() => {
      if (signal === "ended") tracks[0]?.dispatchEvent(new Event(signal));
      else {
        const recorder = start.mock.instances[0];
        if (recorder instanceof TestMediaRecorder) recorder.dispatchEvent(new Event(signal));
      }
    });
    await advance(0);
    expect(dialog().getByText(speaking.paused)).toBeVisible();
    expect(tracks[0]?.stop).toHaveBeenCalledOnce();
    expect(await store.listPracticeEvents({ topicId })).toEqual({ ok: true, value: [] });
  });

  it("freezes an answer without a microphone until the learner chooses Continue", async () => {
    const visibility = vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
    const { entry } = renderExercise();
    fireEvent.click(entry);
    endQuestion();
    const skip = await screen.findByRole("button", { name: mock.ready.micSkip });
    installClock();
    fireEvent.click(skip);
    await advance(2000);
    expect(timer()).toHaveTextContent("۰:۰۲");

    visibility.mockReturnValue("hidden");
    fireEvent(document, new Event("visibilitychange"));
    expect(dialog().getByText(speaking.paused)).toBeVisible();
    await advance(30_000);
    visibility.mockReturnValue("visible");
    fireEvent(document, new Event("visibilitychange"));
    await advance(2000);
    expect(dialog().getByText(speaking.paused)).toBeVisible();
    expect(timer()).toHaveTextContent("۰:۰۲");
    expect(await store.listPracticeEvents({ topicId })).toEqual({ ok: true, value: [] });

    fireEvent.click(button(speaking.resume));
    await advance(1000);
    expect(timer()).toHaveTextContent("۰:۰۳");
    expect(getUserMedia).not.toHaveBeenCalled();
    expect(await store.listPracticeEvents({ topicId })).toEqual({ ok: true, value: [] });
  });

  it("pauses while permission is pending and ignores an old rejection after explicit Continue", async () => {
    let rejectFirst: (error: Error) => void = () => undefined;
    getUserMedia.mockImplementationOnce(
      () =>
        new Promise((_, reject) => {
          rejectFirst = reject;
        }),
    );
    let grantSecond: (stream: unknown) => void = () => undefined;
    getUserMedia.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          grantSecond = resolve;
        }),
    );
    const visibility = vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
    const { entry } = renderExercise();
    fireEvent.click(entry);
    endQuestion();
    const allow = await allowMic();
    installClock();
    fireEvent.click(allow);
    expect(getUserMedia).toHaveBeenCalledOnce();
    expect(dialog().getByText(speaking.micWaiting)).toBeVisible();
    visibility.mockReturnValue("hidden");
    fireEvent(document, new Event("visibilitychange"));
    expect(dialog().getByText(speaking.paused)).toBeVisible();
    expect(timer()).toHaveTextContent("۰:۰۰");
    await advance(30_000);
    visibility.mockReturnValue("visible");
    fireEvent(document, new Event("visibilitychange"));
    await advance(2000);
    expect(dialog().getByText(speaking.paused)).toBeVisible();
    expect(timer()).toHaveTextContent("۰:۰۰");
    expect(getUserMedia).toHaveBeenCalledOnce();
    expect(await store.listPracticeEvents({ topicId })).toEqual({ ok: true, value: [] });
    fireEvent.click(button(speaking.resume));
    expect(getUserMedia).toHaveBeenCalledTimes(2);
    const track = new TestTrack();
    await act(async () => {
      rejectFirst(new DOMException("old request", "NotAllowedError"));
      await Promise.resolve();
      grantSecond({ getTracks: () => [track], getAudioTracks: () => [track] });
    });
    expect(dialog().getByText(speaking.recording, { exact: true })).toBeVisible();
    expect(track.stop).not.toHaveBeenCalled();
  });

  it("starts with the full recording cap after a long unrecorded response", async () => {
    getUserMedia.mockRejectedValueOnce(new DOMException("test", "NotFoundError"));
    const { user, entry } = renderExercise();
    await user.click(entry);
    endQuestion();
    const allow = await allowMic();
    installClock();
    await act(() => {
      fireEvent.click(allow);
      return Promise.resolve();
    });
    expect(screen.getByText(mock.ready.micUnavailable, { exact: true })).toBeVisible();
    await advance(recordingCapMs + 1000);
    await act(() => {
      fireEvent.click(button(speaking.micRetry));
      return Promise.resolve();
    });
    expect(screen.getByText(speaking.recording, { exact: true })).toBeVisible();
    await advance(recordingCapMs - 1);
    expect(tracks[0]?.stop).not.toHaveBeenCalled();
    await advance(1);
    expect(tracks[0]?.stop).toHaveBeenCalledOnce();
  });

  it("shows the review-saved notice when the topic was due", async () => {
    vi.spyOn(store, "listDueReviews").mockResolvedValue({
      ok: true,
      value: [{ topicId, day: 3, dueDate: "2026-11-01" }],
    });
    const { user, entry } = renderExercise();
    await user.click(entry);
    endQuestion();
    await user.click(await screen.findByRole("button", { name: mock.ready.micSkip }));
    await user.click(button(study.answerDone));
    expect(await screen.findByText(study.reviewSaved)).toBeVisible();
  });

  it("stops tracks and releases the wake lock on unmount without saving an unfinished response", async () => {
    const { user, entry, unmount } = renderExercise();
    await user.click(entry);
    await record();

    unmount();
    expect(tracks[0]?.stop).toHaveBeenCalledOnce();
    expect(release).toHaveBeenCalledOnce();
    expect(currentSrc()).toBeNull();
    expect(createUrl).not.toHaveBeenCalled();
    expect(await store.listPracticeEvents({ topicId })).toEqual({ ok: true, value: [] });
  });

  it("releases a microphone that resolves after leaving", async () => {
    const track = new TestTrack();
    let grant: (stream: unknown) => void = () => undefined;
    getUserMedia.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          grant = resolve;
        }),
    );
    const { user, entry, unmount } = renderExercise();
    await user.click(entry);
    endQuestion();
    await user.click(await allowMic());
    await waitFor(() => {
      expect(getUserMedia).toHaveBeenCalledOnce();
    });
    unmount();
    await act(async () => {
      grant({ getTracks: () => [track], getAudioTracks: () => [track] });
      await Promise.resolve();
    });
    expect(track.stop).toHaveBeenCalledOnce();
    expect(wakeLock).not.toHaveBeenCalled();
  });

  it("discards an existing take on browser Back", async () => {
    const { user, entry } = renderExercise();
    await user.click(entry);
    await record();
    await user.click(button(study.answerDone));
    await screen.findByText(study.practiceSaved);
    act(() => {
      window.history.back();
    });
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(revokeUrl).toHaveBeenCalledWith("blob:take-1");
  });

  it("keeps the App Router state through Back and Forward without reopening or reloading", async () => {
    const history = stubHistory();
    const { entry } = renderExercise();
    fireEvent.click(entry);
    const sentinel = history.current();
    expect(sentinel).toMatchObject(history.topicState);
    expect(sentinel).toHaveProperty("pd3AnswerAloud");
    expect(dialog().getByText(speaking.listening)).toBeVisible();

    act(() => {
      window.history.back();
    });
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(history.current()).toEqual(history.topicState);
    act(() => {
      window.history.forward();
    });
    expect(history.current()).toEqual(sentinel);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(history.reload).not.toHaveBeenCalled();
  });

  it.each(["reload", "BFCache restore"] as const)(
    "creates a fresh sentinel after %s so Close and Back return to the topic entry",
    async (restore) => {
      const history = stubHistory();
      let view = renderExercise();
      fireEvent.click(view.entry);
      const stale = history.current();
      if (restore === "reload") {
        view.unmount();
        view = renderExercise();
      } else {
        fireEvent(window, new PageTransitionEvent("pagehide", { persisted: true }));
        fireEvent(window, new PageTransitionEvent("pageshow", { persisted: true }));
      }
      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });

      fireEvent.click(view.entry);
      expect(history.current()).toMatchObject(history.topicState);
      expect(history.current()).toHaveProperty("pd3AnswerAloud");
      expect(history.current()).not.toEqual(stale);
      fireEvent.click(button(speaking.close));
      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
      expect(history.current()).toEqual(stale);

      fireEvent.click(view.entry);
      expect(history.current()).not.toEqual(stale);
      act(() => {
        window.history.back();
      });
      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
      expect(history.current()).toEqual(stale);
      expect(history.reload).not.toHaveBeenCalled();
    },
  );

  it("can open and close in place when pushState throws", async () => {
    vi.spyOn(window.history, "pushState").mockImplementation(() => {
      throw new DOMException("History unavailable", "SecurityError");
    });
    const back = vi.spyOn(window.history, "back");
    const { entry } = renderExercise();
    fireEvent.click(entry);
    expect(dialog().getByText(speaking.listening)).toBeVisible();
    fireEvent.click(button(speaking.close));
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(back).not.toHaveBeenCalled();
  });

  it("falls back to the transcript after the configured slow-load timeout", async () => {
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValueOnce(undefined);
    const { entry } = renderExercise();
    installClock();
    fireEvent.click(entry);
    await advance(examConfig.slowLoadNoticeSeconds * 1000 - 1);
    expect(dialog().getByText(speaking.listening)).toBeVisible();
    await advance(1);
    expect(dialog().getByText(speaking.questionFailed)).toBeVisible();
    expect(button(speaking.readQuestion)).toBeVisible();
  });

  it("offers a transcript-only fallback and keeps the model accessible when practice storage fails", async () => {
    vi.spyOn(store, "recordPractice").mockResolvedValue({ ok: false, reason: "unavailable" });
    vi.spyOn(HTMLMediaElement.prototype, "play").mockRejectedValueOnce(
      new DOMException("test", "NotAllowedError"),
    );
    const { user, entry } = renderExercise();
    await user.click(entry);
    expect(await screen.findByText(speaking.questionFailed)).toBeVisible();
    await user.click(button(speaking.readQuestion));
    await user.click(await screen.findByRole("button", { name: mock.ready.micSkip }));
    await user.click(button(study.answerDone));
    expect(await screen.findByText(study.practiceSaveFailed)).toBeVisible();
    expect(button(study.playSample)).toBeVisible();
    expect(getUserMedia).not.toHaveBeenCalled();
  });
});
