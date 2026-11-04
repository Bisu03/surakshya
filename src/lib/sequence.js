import Counter from "@/models/Counter.models";

/**
 * Atomically reserve the next value in a named sequence (e.g. "regid", "mrdid").
 * Uses an atomic $inc so concurrent callers never receive the same value.
 * Returns the reserved sequence number.
 */
export async function reserveSequence(id) {
  const counter = await Counter.findOneAndUpdate(
    { id },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return counter.seq;
}

/**
 * Reclaim a reserved value ONLY if we were the last to take it (the counter's
 * seq still equals the value we reserved). Concurrency-safe: if another request
 * advanced the counter in between, the conditional update matches nothing and
 * this is a no-op — so it can never hand the same number out twice. Best-effort
 * cleanup; it never throws.
 */
export async function releaseSequence(id, reserved) {
  if (reserved === undefined || reserved === null) return;
  try {
    await Counter.updateOne({ id, seq: reserved }, { $inc: { seq: -1 } });
  } catch {
    // Cleanup must never surface an error to the caller.
  }
}
