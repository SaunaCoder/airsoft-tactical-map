/** Server-side flood guard only. Send-rate throttling and smoothing belong to the client (P1-1). */
export const MIN_POSITION_INTERVAL_MS = 1000;

export function isTooFrequent(lastAcceptedAt: number | undefined, now: number): boolean {
  return lastAcceptedAt !== undefined && now - lastAcceptedAt < MIN_POSITION_INTERVAL_MS;
}
