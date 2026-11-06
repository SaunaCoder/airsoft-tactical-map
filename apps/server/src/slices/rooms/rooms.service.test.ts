import { joinCodeSchema } from '@airsoft/shared';
import { describe, expect, it, vi } from 'vitest';
import {
  buildRoomState,
  createRoom,
  generateJoinCode,
  generateLeaderToken,
  hashLeaderToken,
  planJoin,
  verifyLeaderToken,
  type InsertRoom,
  type StoredRoom,
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

describe('planJoin', () => {
  const token = generateLeaderToken();
  const alpha = '11111111-1111-4111-8111-111111111111';
  const fresh = '22222222-2222-4222-8222-222222222222';
  const room: StoredRoom = {
    code: 'ABC234',
    leaderTokenHash: hashLeaderToken(token),
    members: [{ id: alpha, name: 'Alpha' }],
  };

  it('issues a new member id for a first join', () => {
    expect(planJoin(room, { code: 'ABC234', name: 'Bravo' }, fresh)).toEqual({
      memberId: fresh,
      name: 'Bravo',
      isNew: true,
      isLeader: false,
    });
  });

  it('resumes the same member on reconnect, with the new name', () => {
    const plan = planJoin(room, { code: 'ABC234', name: 'Alpha 2', memberId: alpha }, fresh);
    expect(plan).toMatchObject({ memberId: alpha, name: 'Alpha 2', isNew: false });
  });

  it('ignores an unknown member id instead of letting the client choose one', () => {
    const plan = planJoin(room, { code: 'ABC234', name: 'Eve', memberId: '33333333-3333-4333-8333-333333333333' }, fresh);
    expect(plan).toMatchObject({ memberId: fresh, isNew: true });
  });

  it('grants leadership only for the matching leader token', () => {
    expect(planJoin(room, { code: 'ABC234', name: 'L', leaderToken: token }, fresh).isLeader).toBe(true);
    expect(planJoin(room, { code: 'ABC234', name: 'L', leaderToken: generateLeaderToken() }, fresh).isLeader).toBe(false);
  });
});

describe('buildRoomState', () => {
  it('marks members online by connected ids', () => {
    const room: StoredRoom = {
      code: 'ABC234',
      leaderTokenHash: 'x',
      members: [
        { id: 'a', name: 'Alpha' },
        { id: 'b', name: 'Bravo' },
      ],
    };
    const state = buildRoomState(room, { memberId: 'a', name: 'Alpha', isNew: false, isLeader: true }, new Set(['a']));
    expect(state).toEqual({
      code: 'ABC234',
      memberId: 'a',
      isLeader: true,
      members: [
        { id: 'a', name: 'Alpha', online: true },
        { id: 'b', name: 'Bravo', online: false },
      ],
    });
  });
});
