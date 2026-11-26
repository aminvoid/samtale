/**
 * Storage names shared by the browser progress store. Kept free of IndexedDB and the schemas so a
 * page can check for a mock exam marker without loading the progress store (ADR-0014 budget).
 */
export const DEFAULT_DATABASE_NAME = "pd3-mundtlig";

const MARKER_KEY = "pd3:mock:in-progress:v1";

export function inProgressMarkerKey(databaseName: string = DEFAULT_DATABASE_NAME): string {
  return databaseName === DEFAULT_DATABASE_NAME ? MARKER_KEY : `${databaseName}:${MARKER_KEY}`;
}

/**
 * Whether this tab holds a marker, valid or not. A cheap pre-check only: reading, writing and
 * clearing the marker still go through ProgressStore. Unavailable storage counts as "no marker".
 */
export function hasInProgressMarker(databaseName?: string): boolean {
  try {
    return (
      typeof window !== "undefined" &&
      window.sessionStorage.getItem(inProgressMarkerKey(databaseName)) !== null
    );
  } catch {
    return false;
  }
}
