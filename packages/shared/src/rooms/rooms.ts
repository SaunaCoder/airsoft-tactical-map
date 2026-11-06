import { z } from 'zod';

/** Uppercase letters and digits without the ambiguous 0/O and 1/I/L. */
export const JOIN_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const JOIN_CODE_LENGTH = 6;

export const joinCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(new RegExp(`^[${JOIN_CODE_ALPHABET}]{${JOIN_CODE_LENGTH}}$`), 'Invalid join code');

export const leaderTokenSchema = z.string().min(1).max(128);
export const memberIdSchema = z.uuid();
export const displayNameSchema = z.string().trim().min(1, 'Enter a name').max(24, 'Max 24 characters');

/** Returned once by `POST /api/rooms`. The leader token is never sent again. */
export const createRoomResponseSchema = z.object({
  code: joinCodeSchema,
  leaderToken: leaderTokenSchema,
});

/** `room:join`. `memberId` is sent on reconnect to resume the same member. */
export const roomJoinSchema = z.object({
  code: joinCodeSchema,
  name: displayNameSchema,
  leaderToken: leaderTokenSchema.optional(),
  memberId: memberIdSchema.optional(),
});

export const memberSchema = z.object({
  id: memberIdSchema,
  name: displayNameSchema,
  online: z.boolean(),
});

/** `room:state`: full snapshot for the joining client, sent on join and every reconnect. */
export const roomStateSchema = z.object({
  code: joinCodeSchema,
  memberId: memberIdSchema,
  isLeader: z.boolean(),
  members: z.array(memberSchema),
});

export type CreateRoomResponse = z.infer<typeof createRoomResponseSchema>;
export type RoomJoin = z.infer<typeof roomJoinSchema>;
export type Member = z.infer<typeof memberSchema>;
export type RoomState = z.infer<typeof roomStateSchema>;
