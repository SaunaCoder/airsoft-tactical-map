import { createHash, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import { JOIN_CODE_ALPHABET, JOIN_CODE_LENGTH, type CreateRoomResponse } from '@airsoft/shared';

export function generateJoinCode(pick: (max: number) => number = randomInt): string {
  let code = '';
  for (let i = 0; i < JOIN_CODE_LENGTH; i++) code += JOIN_CODE_ALPHABET[pick(JOIN_CODE_ALPHABET.length)];
  return code;
}

export function generateLeaderToken(): string {
  return randomBytes(32).toString('base64url');
}

// Unsalted SHA-256 is enough here: the token is 256 bits of CSPRNG output, not a guessable password.
export function hashLeaderToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
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
