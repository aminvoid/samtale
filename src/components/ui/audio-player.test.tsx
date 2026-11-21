import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getDirection } from "@/i18n/config";
import type { WordTiming } from "@/lib/audio/manifest-schema";
import { AudioPlayerProvider } from "@/lib/audio/player";
import { renderWithIntl } from "@/test/render-with-intl";
import { AudioPlayer } from "./audio-player";
import { DirectionProvider } from "./direction-provider";
import { PlayButton } from "./play-button";
import { TapToHear } from "./tap-to-hear";
import { WordHighlighter } from "./word-highlighter";

const playLabel = "پخش پرسش";
const positionLabel = "موقعیت پخش";
const speedLabel = "سرعت";
const audio = { url: "/audio/test.mp3", durationMs: 31000 };

function renderPlayer() {
  let paused = true;
  vi.spyOn(HTMLMediaElement.prototype, "paused", "get").mockImplementation(() => paused);
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {
    paused = true;
  });
  vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => undefined);
  const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(() => {
    paused = false;
    return Promise.resolve();
  });
  const direction = getDirection("fa");
  renderWithIntl(
    <DirectionProvider direction={direction}>
      <div dir={direction}>
        <AudioPlayerProvider>
          <AudioPlayer itemId="test" audio={audio} label={playLabel} />
        </AudioPlayerProvider>
      </div>
    </DirectionProvider>,
  );
  return play;
}

function getMedia(element: unknown) {
  if (element instanceof HTMLAudioElement) return element;
  throw new Error("Expected playback on an audio element");
}

afterEach(cleanup);

describe("AudioPlayer", () => {
  it("seeks forward with ArrowRight in RTL and keeps speed selection in RTL", async () => {
    const user = userEvent.setup();
    const play = renderPlayer();
    const button = screen.getByRole("button", { name: playLabel, pressed: false });
    const slider = screen.getByRole("slider", { name: positionLabel });

    expect(slider).toBeDisabled();
    await user.click(button);
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(slider).toBeDisabled();
    const media = getMedia(play.mock.contexts[0]);
    fireEvent.playing(media);
    expect(slider).toBeEnabled();

    await user.tab();
    expect(slider).toHaveFocus();
    const previous = Number(slider.getAttribute("aria-valuenow"));
    await user.keyboard("{ArrowRight}");
    expect(Number(slider.getAttribute("aria-valuenow"))).toBeGreaterThan(previous);
    expect(slider).toHaveAttribute("aria-valuetext", "۰:۰۱ از ۰:۳۱");
    expect(media.currentTime).toBe(1);
    fireEvent.waiting(media);
    expect(slider).toHaveFocus();
    expect(slider.closest("[aria-disabled=true]")).toBeInTheDocument();
    fireEvent.playing(media);

    const speed = screen.getByRole("radiogroup", { name: speedLabel });
    const normal = within(speed).getByRole("radio", { name: "سرعت ۱ برابر", checked: true });
    await user.tab();
    expect(normal).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(within(speed).getByRole("radio", { name: "سرعت ۱٫۲۵ برابر", checked: true })).toHaveFocus();
    expect(media.playbackRate).toBe(1.25);
    expect(within(speed).getByRole("radio", { name: "سرعت ۰٫۷۵ برابر" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: playLabel, pressed: true }));
    expect(screen.getByRole("button", { name: playLabel, pressed: false })).toBe(button);
  });

  it("announces failure and retries with the same accessible name", async () => {
    const user = userEvent.setup();
    const play = renderPlayer();
    play.mockRejectedValueOnce(new DOMException("Unsupported", "NotSupportedError"));
    await user.click(screen.getByRole("button", { name: playLabel, pressed: false }));

    const notice = screen.getByRole("status");
    expect(notice).toHaveTextContent("صدا بارگیری نشد · دوباره تلاش کنید");
    const retry = screen.getByRole("button", { name: playLabel, pressed: false });
    expect(retry).toHaveAccessibleDescription(notice.textContent);
    await user.click(retry);
    expect(play).toHaveBeenCalledTimes(2);
    expect(notice).toBeEmptyDOMElement();
  });
});

describe("Audio controls", () => {
  it("gives an examiner PlayButton a constant name and a pressed state", async () => {
    const user = userEvent.setup();
    function Example() {
      const [playing, setPlaying] = useState(false);
      return (
        <PlayButton
          variant="examiner"
          status={playing ? "playing" : "paused"}
          onClick={() => {
            setPlaying(true);
          }}
          showLabel
        />
      );
    }
    renderWithIntl(<Example />);
    const label = "پخش صدای ممتحن";
    const button = screen.getByRole("button", { name: label, pressed: false });
    await user.click(button);
    expect(screen.getByRole("button", { name: label, pressed: true })).toBe(button);
  });

  it("offers a named TapToHear action", async () => {
    const user = userEvent.setup();
    const resume = vi.fn();
    renderWithIntl(<TapToHear onClick={resume} />);
    await user.click(screen.getByRole("button", { name: "برای شنیدن ممتحن ضربه بزنید" }));
    expect(resume).toHaveBeenCalledOnce();
  });

  it("keeps Danish text and the paused highlight, then clears the highlight on end", async () => {
    const user = userEvent.setup();
    const text = "Hej, hvor går du?";
    const words: WordTiming[] = [[5, 9, 200, 500]];
    const { rerender } = render(
      <WordHighlighter as="p" text={text} words={words} status="paused" currentTimeMs={350} />,
    );
    const transcript = screen.getByRole("paragraph");
    expect(transcript).toHaveAttribute("lang", "da");
    expect(transcript).toHaveAttribute("dir", "ltr");
    expect(transcript).toHaveTextContent(text);
    expect(within(transcript).getByText("hvor")).toHaveClass("underline");

    rerender(<WordHighlighter as="p" text={text} words={words} status="ended" currentTimeMs={0} />);
    expect(screen.getByRole("paragraph")).toHaveTextContent(text);
    expect(within(transcript).queryByText("hvor", { exact: true })).toBeNull();
    await user.tab();
    expect(document.body).toHaveFocus();
  });
});
