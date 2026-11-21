export async function finishTransaction<T>(
  transaction: { done: Promise<void>; abort(): void },
  run: () => Promise<T>,
): Promise<T> {
  const done = transaction.done;
  void done.catch(() => undefined);
  try {
    // A request exposes its specific failure before the transaction reports an abort.
    const result = await run();
    await done;
    return result;
  } catch (error) {
    try {
      transaction.abort();
    } catch {
      // IndexedDB may already have aborted the transaction.
    }
    await done.catch(() => undefined);
    throw error;
  }
}
