import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  MONGO_URL: z.string().min(1).default('mongodb://localhost:27017/airsoft'),
});

export const config = envSchema.parse(process.env);
