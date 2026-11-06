/** Minimum time between sent fixes. Smarter movement-based throttling and smoothing are P1-1. */
export const SEND_INTERVAL_MS = 3000;

/** 0 when a fix may go out now, else how long to wait. A throttled fix is sent after the wait, never dropped. */
export function msUntilNextSend(lastSentAt: number | undefined, now: number): number {
  return lastSentAt === undefined ? 0 : Math.max(0, lastSentAt + SEND_INTERVAL_MS - now);
}
