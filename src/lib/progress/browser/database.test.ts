import { IDBDatabase, IDBFactory, IDBObjectStore } from "fake-indexeddb";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ProgressDatabase } from "./database";

const databaseName = "progress-test";

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      resolve(request.result);
    };
    request.onerror = () => {
      reject(new Error("Fixture database request failed", { cause: request.error }));
    };
  });
}

beforeEach(() => vi.stubGlobal("indexedDB", new IDBFactory()));

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

it("reports unsupported storage when the page has no IndexedDB, and can open if it becomes available", async () => {
  const factory = indexedDB;
  vi.stubGlobal("indexedDB", undefined);
  const database = new ProgressDatabase(databaseName);
  await expect(database.open()).resolves.toEqual({ kind: "unavailable", reason: "unsupported" });

  vi.stubGlobal("indexedDB", factory);
  const result = await database.open();
  if (result.kind !== "available")
    throw new Error("Expected the database to open after storage became available");
  result.db.close();
});

it.each([
  [new DOMException("", "QuotaExceededError"), "quota"],
  [new DOMException("", "NotSupportedError"), "unsupported"],
  [new DOMException("", "InvalidStateError"), "blocked"],
  [new Error("Unexpected open failure"), "error"],
])("classifies a browser open failure as %s → %s", async (error, reason) => {
  vi.spyOn(indexedDB, "open").mockImplementation(() => {
    throw error;
  });
  await expect(new ProgressDatabase(databaseName).open()).resolves.toEqual({ kind: "unavailable", reason });
});

it("times out behind another tab, closes a late connection, and opens on retry", async () => {
  const otherTab = await requestResult(indexedDB.open(databaseName, 1));
  const deletion = indexedDB.deleteDatabase(databaseName);
  const removing = requestResult(deletion);
  const blocked = Promise.withResolvers<Event>();
  deletion.addEventListener("blocked", blocked.resolve);
  try {
    await blocked.promise;
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    const database = new ProgressDatabase(databaseName);
    const result = database.open();
    await vi.advanceTimersByTimeAsync(3000);
    await expect(result).resolves.toEqual({ kind: "unavailable", reason: "blocked" });
    vi.useRealTimers();

    otherTab.close();
    const close = vi.spyOn(IDBDatabase.prototype, "close");
    await removing;
    // A second open at the same version waits behind the expired request without forcing it closed.
    const nextTab = await requestResult(indexedDB.open(databaseName, 1));
    try {
      expect(close).toHaveBeenCalledOnce();
    } finally {
      nextTab.close();
    }

    const retry = await database.open();
    if (retry.kind !== "available") throw new Error("Expected the database to open on retry");
    retry.db.close();
  } finally {
    otherTab.close();
  }
});

it("aborts a failed schema upgrade and can initialize a clean database on retry", async () => {
  vi.spyOn(IDBObjectStore.prototype, "createIndex").mockImplementationOnce(() => {
    throw new DOMException("", "InvalidStateError");
  });
  const database = new ProgressDatabase(databaseName);
  await expect(database.open()).resolves.toEqual({ kind: "unavailable", reason: "error" });
  const retry = await database.open();
  if (retry.kind !== "available") throw new Error("Expected a clean schema on retry");
  try {
    expect(await retry.db.get("meta", "schemaVersion")).toEqual({ key: "schemaVersion", v: 1 });
    expect(retry.db.objectStoreNames).toContain("practiceEvents");
  } finally {
    retry.db.close();
  }
});
