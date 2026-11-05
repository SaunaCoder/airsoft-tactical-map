import { joinCodeSchema } from '@airsoft/shared';
import { describe, expect, it, vi } from 'vitest';
import {
  createRoom,
  generateJoinCode,
  generateLeaderToken,
  hashLeaderToken,
  verifyLeaderToken,
  type InsertRoom,
} from './rooms.service.ts';

describe('generateJoinCode', () => {
  it('produces valid 6-char codes from the unambiguous alphabet', () => {
    for (let i = 0; i < 500; i++) expect(joinCodeSchema.safeParse(generateJoinCode()).success).toBe(true);
  });

  it('maps random picks onto the alphabet', () => {
    expect(generateJoinCode(() => 0)).toBe('AAAAAA');
    expect(generateJoinCode((max) => max - 1)).toBe('999999');
  });
});

describe('leader token', () => {
  it('verifies the matching token only', () => {
    const token = generateLeaderToken();
    const hash = hashLeaderToken(token);
    expect(hash).not.toContain(token);
    expect(verifyLeaderToken(token, hash)).toBe(true);
    expect(verifyLeaderToken(generateLeaderToken(), hash)).toBe(false);
  });

  it('rejects a malformed stored hash without throwing', () => {
    expect(verifyLeaderToken('anything', 'not-hex')).toBe(false);
  });

  it('generates distinct tokens', () => {
    expect(generateLeaderToken()).not.toBe(generateLeaderToken());
  });
});

describe('createRoom', () => {
  it('stores only the token hash and returns the plain token once', async () => {
    const insert = vi.fn<InsertRoom>().mockResolvedValue(true);
    const room = await createRoom(insert, () => 'ABC234');
    expect(room.code).toBe('ABC234');
    expect(insert).toHaveBeenCalledWith({ code: 'ABC234', leaderTokenHash: hashLeaderToken(room.leaderToken) });
  });

  it('retries with a new code on collision', async () => {
    const insert = vi.fn<InsertRoom>().mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    const codes = ['TAKEN2', 'FREE23'];
    const room = await createRoom(insert, () => codes.shift()!);
    expect(room.code).toBe('FREE23');
    expect(insert).toHaveBeenCalledTimes(2);
  });

  it('gives up after repeated collisions', async () => {
    const insert = vi.fn<InsertRoom>().mockResolvedValue(false);
    await expect(createRoom(insert, () => 'TAKEN2')).rejects.toThrow('No free join code');
    expect(insert).toHaveBeenCalledTimes(5);
  });
});
