import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  MONGO_URL: z.string().min(1).default('mongodb://localhost:27017/airsoft'),
  /** A room is deleted this long after its last activity (join, position, drawing change). */
  ROOM_TTL_HOURS: z.coerce.number().positive().default(24),
});

export const config = envSchema.parse(process.env);
