import { describe, expect, it } from 'vitest';
import { RoomModel, activeAt } from './rooms.schema.ts';
import { nextExpiry } from './rooms.service.ts';

describe('room expiry', () => {
  it('has a TTL index that deletes the room at expiresAt', () => {
    expect(RoomModel.schema.indexes()).toContainEqual([{ expiresAt: 1 }, expect.objectContaining({ expireAfterSeconds: 0 })]);
  });

  it('activeAt pushes expiresAt forward from now', () => {
    const now = new Date('2026-05-01T10:00:00Z');
    expect(activeAt(now)).toEqual({ expiresAt: nextExpiry(now) });
  });
});
