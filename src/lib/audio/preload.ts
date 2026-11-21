export type PreloadProgress = { loaded: number; total: number };

/**
 * Fetch each distinct clip URL. The caller owns the returned object URLs until
 * abort() or revoke(); either method releases all URLs and cancels pending work.
 */
export function preloadClips(clipUrls: readonly string[], onProgress?: (progress: PreloadProgress) => void) {
  const controller = new AbortController();
  const { signal } = controller;
  const urls = new Map<string, string>();
  const sources = [...new Set(clipUrls)];

  function release() {
    controller.abort();
    for (const url of urls.values()) URL.revokeObjectURL(url);
    urls.clear();
  }

  async function load(): Promise<ReadonlyMap<string, string>> {
    onProgress?.({ loaded: 0, total: sources.length });
    await Promise.all(
      sources.map(async (source) => {
        const response = await fetch(source, { signal });
        const blob = response.ok ? await response.blob() : null;
        if (blob === null) throw new Error(`Audio preload failed (${String(response.status)})`);
        signal.throwIfAborted();
        urls.set(source, URL.createObjectURL(blob));
        onProgress?.({ loaded: urls.size, total: sources.length });
      }),
    );
    signal.throwIfAborted();
    return urls;
  }

  const promise = load().catch((error: unknown) => {
    release();
    throw error;
  });

  return { promise, abort: release, revoke: release };
}
