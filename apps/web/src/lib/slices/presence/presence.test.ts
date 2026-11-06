import { describe, expect, it } from 'vitest';
import { SEND_INTERVAL_MS, msUntilNextSend } from './presence.ts';

describe('msUntilNextSend', () => {
  it('sends the first fix immediately', () => {
    expect(msUntilNextSend(undefined, 0)).toBe(0);
  });

  it('waits out the rest of the interval after a send', () => {
    expect(msUntilNextSend(10_000, 10_000)).toBe(SEND_INTERVAL_MS);
    expect(msUntilNextSend(10_000, 10_000 + SEND_INTERVAL_MS - 1)).toBe(1);
  });

  it('sends immediately once the interval has passed', () => {
    expect(msUntilNextSend(10_000, 10_000 + SEND_INTERVAL_MS)).toBe(0);
    expect(msUntilNextSend(10_000, 99_999)).toBe(0);
  });
});
