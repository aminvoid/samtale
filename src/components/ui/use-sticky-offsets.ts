"use client";

import { useEffect } from "react";

const selector = "[data-sticky]";
const topOffset = "--sticky-offset";
const bottomOffset = "--bottom-offset";

function blockSize(element: Element, style: CSSStyleDeclaration): number {
  const { height, width } = element.getBoundingClientRect();
  return /^(vertical|sideways)-/.test(style.writingMode) ? width : height;
}

/** Mount once in the active shell. Focused bars use `short:static data-[pinned=false]:static`. */
export function useStickyOffsets() {
  useEffect(() => {
    const root = document.documentElement;
    const previousOffsets = [topOffset, bottomOffset].map((name) => ({
      name,
      value: root.style.getPropertyValue(name),
      priority: root.style.getPropertyPriority(name),
    }));
    const viewport = window.visualViewport;
    const shortViewport = window.matchMedia("(max-height: 30rem)");
    let observed = new Set<Element>();
    const unpinned = new Map<Element, string | null>();
    let frame: number | undefined;

    function restorePin(element: Element, previous: string | null) {
      if (previous === null) element.removeAttribute("data-pinned");
      else element.setAttribute("data-pinned", previous);
      unpinned.delete(element);
    }

    function measure() {
      frame = undefined;
      const bars = new Set(root.querySelectorAll(selector));
      for (const bar of observed) {
        if (bars.has(bar)) continue;
        resizeObserver.unobserve(bar);
      }
      for (const bar of bars) {
        if (observed.has(bar)) continue;
        resizeObserver.observe(bar, { box: "border-box" });
      }
      observed = bars;

      const viewportHeight = viewport?.height ?? window.innerHeight;
      const largeRootText = Number.parseFloat(getComputedStyle(root).fontSize) > 24;
      const focusedBars = new Set<Element>();
      let answerTooTall = false;
      for (const bar of bars) {
        const kind = bar.getAttribute("data-sticky");
        if (kind === "focused-header" || kind === "answer-area") focusedBars.add(bar);
        if (kind === "answer-area" && blockSize(bar, getComputedStyle(bar)) > viewportHeight * 0.4) {
          answerTooTall = true;
        }
      }

      const unpinFocusedBars = shortViewport.matches || largeRootText || answerTooTall;
      for (const [bar, previous] of unpinned) {
        if (unpinFocusedBars && focusedBars.has(bar)) continue;
        restorePin(bar, previous);
      }
      if (unpinFocusedBars) {
        for (const bar of focusedBars) {
          if (unpinned.has(bar)) continue;
          unpinned.set(bar, bar.getAttribute("data-pinned"));
          bar.setAttribute("data-pinned", "false");
        }
      }

      let top = 0;
      let bottom = 0;
      for (const bar of bars) {
        if (unpinned.has(bar)) continue;
        const kind = bar.getAttribute("data-sticky");
        if (kind === null) continue;
        const style = getComputedStyle(bar);
        if (style.position !== "sticky" && style.position !== "fixed") continue;
        switch (kind) {
          case "section-nav":
          case "focused-header":
            top += blockSize(bar, style);
            break;
          case "tab-bar":
          case "answer-area":
            bottom += blockSize(bar, style);
            break;
        }
      }
      root.style.setProperty(topOffset, top.toString() + "px");
      root.style.setProperty(bottomOffset, bottom.toString() + "px");
    }

    function scheduleMeasure() {
      frame ??= requestAnimationFrame(measure);
    }

    const resizeObserver = new ResizeObserver(scheduleMeasure);
    const mutationObserver = new MutationObserver((records) => {
      // Shells can stay mounted while a route adds or removes a sticky bar.
      if (
        records.some(
          (record) =>
            record.type === "childList" ||
            record.attributeName === "data-sticky" ||
            (record.target instanceof Element && observed.has(record.target)),
        )
      ) {
        scheduleMeasure();
      }
    });
    mutationObserver.observe(root, {
      subtree: true,
      childList: true,
      attributeFilter: ["data-sticky", "class", "style", "hidden"],
    });
    window.addEventListener("resize", scheduleMeasure);
    viewport?.addEventListener("resize", scheduleMeasure);
    scheduleMeasure();

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener("resize", scheduleMeasure);
      viewport?.removeEventListener("resize", scheduleMeasure);
      if (frame !== undefined) cancelAnimationFrame(frame);
      for (const [bar, previous] of unpinned) restorePin(bar, previous);
      for (const { name, value, priority } of previousOffsets) {
        root.style.setProperty(name, value, priority);
      }
    };
  }, []);
}
