import type { ProgressEvent } from "./schema";

export function latestRecordedAt(left: string | undefined, right: string): string {
  return left !== undefined && Date.parse(left) >= Date.parse(right) ? left : right;
}

export function orderForAppend(event: ProgressEvent, latest: string | undefined, assignOrder: boolean) {
  // Preserve imported event timestamps. Locally generated events follow the committed log
  // even after a clock rollback, reload or simultaneous write from another tab.
  if (assignOrder && latest !== undefined && Date.parse(event.recordedAt) <= Date.parse(latest)) {
    const recordedAt = new Date(Date.parse(latest) + 1).toISOString();
    return { entry: { ...event, recordedAt }, lastRecordedAt: recordedAt };
  }
  return { entry: event, lastRecordedAt: latestRecordedAt(latest, event.recordedAt) };
}
