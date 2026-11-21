import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useStickyOffsets } from "./use-sticky-offsets";

const root = document.documentElement;
const observe = vi.fn();
const unobserve = vi.fn();
const disconnect = vi.fn();
const shortViewport = { matches: false };
const viewport = Object.assign(new EventTarget(), { height: 800 });
let notifyResize: (() => void) | undefined;

class ResizeObserverMock {
  constructor(callback: () => void) {
    notifyResize = callback;
  }

  observe = observe;
  unobserve = unobserve;
  disconnect = disconnect;
}

function addBar(kind: string, position: string, blockSize: number) {
  const element = document.createElement("div");
  element.dataset.sticky = kind;
  element.style.position = position;
  const rect = vi.spyOn(element, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 0, 400, blockSize));
  document.body.append(element);
  return { element, rect };
}

function expectOffsets(top: string, bottom: string) {
  expect(root.style.getPropertyValue("--sticky-offset")).toBe(top);
  expect(root.style.getPropertyValue("--bottom-offset")).toBe(bottom);
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame"] });
  vi.stubGlobal("ResizeObserver", ResizeObserverMock);
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => shortViewport),
  );
  vi.stubGlobal("visualViewport", viewport);
  viewport.height = 800;
  shortViewport.matches = false;
  notifyResize = undefined;
});

afterEach(() => {
  cleanup();
  root.querySelectorAll("[data-sticky]").forEach((bar) => {
    bar.remove();
  });
  root.style.removeProperty("font-size");
  root.style.removeProperty("--sticky-offset");
  root.style.removeProperty("--bottom-offset");
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("useStickyOffsets", () => {
  it("observes each bar and sums the measured block size by edge", () => {
    const header = addBar("focused-header", "sticky", 88);
    const nav = addBar("section-nav", "sticky", 48);
    const tabBar = addBar("tab-bar", "fixed", 64);
    const answer = addBar("answer-area", "static", 300);
    renderHook(useStickyOffsets);
    vi.advanceTimersToNextFrame();

    expect(observe).toHaveBeenCalledTimes(4);
    for (const { element } of [header, nav, tabBar, answer]) {
      expect(observe).toHaveBeenCalledWith(element, { box: "border-box" });
    }
    expectOffsets("136px", "64px");

    header.rect.mockReturnValue(new DOMRect(0, 0, 400, 96));
    tabBar.element.style.position = "relative";
    answer.element.style.position = "fixed";
    notifyResize?.();
    expectOffsets("136px", "64px");
    vi.advanceTimersToNextFrame();
    expectOffsets("144px", "300px");
  });

  it("unpins both focused bars when space runs out and restores them when it returns", () => {
    const header = addBar("focused-header", "sticky", 88).element;
    const answer = addBar("answer-area", "fixed", 300).element;
    addBar("section-nav", "sticky", 48);
    renderHook(useStickyOffsets);
    vi.advanceTimersToNextFrame();
    expectOffsets("136px", "300px");

    viewport.height = 667;
    viewport.dispatchEvent(new Event("resize"));
    vi.advanceTimersToNextFrame();
    expect(header).toHaveAttribute("data-pinned", "false");
    expect(answer).toHaveAttribute("data-pinned", "false");
    expectOffsets("48px", "0px");

    viewport.height = 750;
    viewport.dispatchEvent(new Event("resize"));
    vi.advanceTimersToNextFrame();
    expect(header).not.toHaveAttribute("data-pinned");
    expect(answer).not.toHaveAttribute("data-pinned");
    expectOffsets("136px", "300px");
  });

  it("keeps the header pinned when a tall answer area is static by design (desktop)", () => {
    const header = addBar("focused-header", "sticky", 88).element;
    const answer = addBar("answer-area", "static", 400).element;
    renderHook(useStickyOffsets);
    vi.advanceTimersToNextFrame();
    expect(header).not.toHaveAttribute("data-pinned");
    expect(answer).not.toHaveAttribute("data-pinned");
    expectOffsets("88px", "0px");
  });

  it("clears the offsets on short viewports or with large root text, and cleans up on unmount", () => {
    const header = addBar("focused-header", "sticky", 88).element;
    const answer = addBar("answer-area", "fixed", 100).element;
    const { unmount } = renderHook(useStickyOffsets);
    shortViewport.matches = true;
    vi.advanceTimersToNextFrame();
    expect(header).toHaveAttribute("data-pinned", "false");
    expect(answer).toHaveAttribute("data-pinned", "false");
    expectOffsets("0px", "0px");

    shortViewport.matches = false;
    window.dispatchEvent(new Event("resize"));
    vi.advanceTimersToNextFrame();
    expectOffsets("88px", "100px");

    root.style.fontSize = "25px";
    window.dispatchEvent(new Event("resize"));
    vi.advanceTimersToNextFrame();
    expectOffsets("0px", "0px");
    expect(answer).toHaveAttribute("data-pinned", "false");

    notifyResize?.();
    unmount();
    window.dispatchEvent(new Event("resize"));
    viewport.dispatchEvent(new Event("resize"));
    vi.advanceTimersToNextFrame();
    expect(disconnect).toHaveBeenCalledOnce();
    expect(header).not.toHaveAttribute("data-pinned");
    expect(answer).not.toHaveAttribute("data-pinned");
    expectOffsets("", "");
  });

  it("observes and releases bars as the current route changes", async () => {
    renderHook(useStickyOffsets);
    vi.advanceTimersToNextFrame();
    expectOffsets("0px", "0px");

    const { element } = addBar("section-nav", "sticky", 48);
    await Promise.resolve();
    vi.advanceTimersToNextFrame();
    expect(observe).toHaveBeenCalledWith(element, { box: "border-box" });
    expectOffsets("48px", "0px");

    element.remove();
    await Promise.resolve();
    vi.advanceTimersToNextFrame();
    expect(unobserve).toHaveBeenCalledWith(element);
    expectOffsets("0px", "0px");
  });

  it("restores pre-existing inline offsets on unmount", () => {
    root.style.setProperty("--sticky-offset", "12px", "important");
    root.style.setProperty("--bottom-offset", "24px");
    const { unmount } = renderHook(useStickyOffsets);
    vi.advanceTimersToNextFrame();
    expectOffsets("0px", "0px");

    unmount();
    expectOffsets("12px", "24px");
    expect(root.style.getPropertyPriority("--sticky-offset")).toBe("important");
  });
});
