import { randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import {
  JOIN_CODE_ALPHABET,
  JOIN_CODE_LENGTH,
  type CreateRoomResponse,
  type LngLat,
  type MapFeature,
  type RoomJoin,
  type RoomState,
} from '@airsoft/shared';
import { config } from '../../core/config.ts';
import { sha256Hex } from '../../core/secrets.ts';

export function generateJoinCode(pick: (max: number) => number = randomInt): string {
  let code = '';
  for (let i = 0; i < JOIN_CODE_LENGTH; i++) code += JOIN_CODE_ALPHABET[pick(JOIN_CODE_ALPHABET.length)];
  return code;
}

/** When a room active at `now` expires. Every room write pushes it forward; MongoDB's TTL index deletes the room. */
export function nextExpiry(now: Date, ttlHours = config.ROOM_TTL_HOURS): Date {
  return new Date(now.getTime() + ttlHours * 3_600_000);
}

export const hashLeaderToken = sha256Hex;

export function generateLeaderToken(): string {
  return randomBytes(32).toString('base64url');
}

export function verifyLeaderToken(token: string, storedHash: string): boolean {
  const actual = Buffer.from(hashLeaderToken(token), 'hex');
  const expected = Buffer.from(storedHash, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** Persists a new room. Resolves `false` when the code is already used by an active room. */
export type InsertRoom = (room: { code: string; leaderTokenHash: string }) => Promise<boolean>;

const MAX_CODE_ATTEMPTS = 5;

export async function createRoom(insert: InsertRoom, newCode = generateJoinCode): Promise<CreateRoomResponse> {
  const leaderToken = generateLeaderToken();
  const leaderTokenHash = hashLeaderToken(leaderToken);
  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
    const code = newCode();
    if (await insert({ code, leaderTokenHash })) return { code, leaderToken };
  }
  throw new Error(`No free join code after ${MAX_CODE_ATTEMPTS} attempts`);
}

export type StoredMember = { id: string; name: string; lastPosition?: LngLat | null };
export type StoredRoom = { code: string; leaderTokenHash: string; members: StoredMember[]; features?: MapFeature[] };
export type JoinPlan = { memberId: string; name: string; isNew: boolean; isLeader: boolean };

/**
 * Decides who is joining. A known `memberId` resumes that member (reconnect); an unknown one is
 * ignored and a fresh id is issued, so clients can't mint ids. Leadership comes only from the token.
 */
// ponytail: member ids are visible to the room, so a member could resume as someone else.
// Harmless while members can only share positions; add a per-member secret if members gain rights.
export function planJoin(room: StoredRoom, join: RoomJoin, newId: string): JoinPlan {
  const known = join.memberId === undefined ? undefined : room.members.find((m) => m.id === join.memberId);
  return {
    memberId: known?.id ?? newId,
    name: join.name,
    isNew: !known,
    isLeader: join.leaderToken !== undefined && verifyLeaderToken(join.leaderToken, room.leaderTokenHash),
  };
}

/** Snapshot for the joining client. `room.members` must already include the joining member. */
export function buildRoomState(room: StoredRoom, me: JoinPlan, onlineIds: ReadonlySet<string>): RoomState {
  return {
    code: room.code,
    memberId: me.memberId,
    isLeader: me.isLeader,
    members: room.members.map((m) => ({
      id: m.id,
      name: m.name,
      online: onlineIds.has(m.id),
      position: m.lastPosition ?? null,
    })),
    features: { type: 'FeatureCollection', features: room.features ?? [] },
  };
}
