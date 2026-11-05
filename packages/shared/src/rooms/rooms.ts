import { z } from 'zod';

/** Uppercase letters and digits without the ambiguous 0/O and 1/I/L. */
export const JOIN_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const JOIN_CODE_LENGTH = 6;

export const joinCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(new RegExp(`^[${JOIN_CODE_ALPHABET}]{${JOIN_CODE_LENGTH}}$`), 'Invalid join code');

/** Returned once by `POST /api/rooms`. The leader token is never sent again. */
export const createRoomResponseSchema = z.object({
  code: joinCodeSchema,
  leaderToken: z.string().min(1),
});

export type CreateRoomResponse = z.infer<typeof createRoomResponseSchema>;
