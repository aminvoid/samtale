import { reportError } from "@/lib/observability/report-error";
import type { StorageAvailability, StorageFailure } from "./progress-store";

function errorName(error: unknown): unknown {
  return typeof error === "object" && error !== null ? Reflect.get(error, "name") : undefined;
}

export function storageFailure(error: unknown): StorageFailure {
  switch (errorName(error)) {
    case "QuotaExceededError":
      return { ok: false, reason: "quota" };
    case "InvalidStateError":
    case "SecurityError":
    case "NotSupportedError":
      return { ok: false, reason: "unavailable" };
    default:
      return { ok: false, reason: "error" };
  }
}

export function openFailure(error: unknown): StorageAvailability & { kind: "unavailable" } {
  switch (errorName(error)) {
    case "QuotaExceededError":
      return { kind: "unavailable", reason: "quota" };
    case "NotSupportedError":
      return { kind: "unavailable", reason: "unsupported" };
    case "InvalidStateError":
    case "SecurityError":
      return { kind: "unavailable", reason: "blocked" };
    default:
      return { kind: "unavailable", reason: "error" };
  }
}

export function reportSkipped(area: string, count: number): void {
  if (count === 0) return;
  const error = new Error(String(count));
  error.name = "InvalidStoredRecords";
  reportError(error, { area });
}
