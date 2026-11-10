import type { Member } from '@airsoft/shared';
import { describe, expect, it } from 'vitest';
import { lastSeenLabel, sortMembers } from './last-seen.ts';

const now = Date.parse('2026-05-01T12:00:00Z');
const ago = (ms: number) => new Date(now - ms).toISOString();

describe('lastSeenLabel', () => {
  it('rounds down to minutes, hours, then days', () => {
    expect(lastSeenLabel(ago(59_000), now)).toBe('just now');
    expect(lastSeenLabel(ago(60_000), now)).toBe('1 min ago');
    expect(lastSeenLabel(ago(59 * 60_000), now)).toBe('59 min ago');
    expect(lastSeenLabel(ago(90 * 60_000), now)).toBe('1 h ago');
    expect(lastSeenLabel(ago(49 * 3_600_000), now)).toBe('2 d ago');
  });

  it('treats a timestamp from the future (clock skew) as just now', () => {
    expect(lastSeenLabel(ago(-120_000), now)).toBe('just now');
  });
});

describe('sortMembers', () => {
  const member = (name: string, online: boolean, lastSeenAgo: number): Member => ({
    id: crypto.randomUUID(),
    name,
    online,
    position: null,
    lastSeen: ago(lastSeenAgo),
  });

  it('lists offline members first, longest gone first, and keeps online members in order', () => {
    const members = [
      member('Alpha', true, 0),
      member('Bravo', false, 60_000),
      member('Charlie', true, 0),
      member('Delta', false, 600_000),
    ];
    expect(sortMembers(members).map((m) => m.name)).toEqual(['Delta', 'Bravo', 'Alpha', 'Charlie']);
  });
});
