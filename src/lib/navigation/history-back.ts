/**
 * History traversals (browser Back or Forward) reach subscribers before the App Router acts on them.
 *
 * The App Router handles `popstate` with a listener it adds when it hydrates, and it re-renders
 * synchronously inside that listener, which can unmount the subscriber. Chromium runs a window's
 * listeners in the order they were added, capture or not, so a listener a component adds later
 * is removed by that unmount before its turn (the mock exam then sees only a route change, and
 * C19 `endEarly` can't save the attempt).
 *
 * This module adds its one listener when it is first evaluated. `src/instrumentation-client.ts`
 * imports it, and Next.js runs that file before the app's own code, so this listener is always
 * ahead of the router's.
 */

type Listener = () => void;

const listeners = new Set<Listener>();

function notify() {
  for (const listener of [...listeners]) listener();
}

if (typeof window !== "undefined") window.addEventListener("popstate", notify);

/** Subscribe to history traversals. Returns the unsubscribe function. */
export function onHistoryBack(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
