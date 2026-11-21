/**
 * The one place errors are reported (ADR-0013). v1 sends nothing anywhere: it logs in development and
 * keeps the last error code in memory. A future reporter (owner approval needed) changes only this file.
 */
export type ErrorContext = { area: string; itemId?: string };

let lastErrorCode: string | undefined;

/** A short, non-personal code for an error: the server digest if there is one, else the error name. */
export function errorCodeOf(error: unknown): string {
  if (error instanceof Error) {
    const digest: unknown = Reflect.get(error, "digest");
    return typeof digest === "string" && digest !== "" ? digest : error.name;
  }
  return typeof error;
}

export function reportError(error: unknown, context: ErrorContext): void {
  lastErrorCode = errorCodeOf(error);
  if (process.env.NODE_ENV === "development") {
    console.error(`[${context.area}${context.itemId === undefined ? "" : `:${context.itemId}`}]`, error);
  }
}

export function getLastErrorCode(): string | undefined {
  return lastErrorCode;
}
