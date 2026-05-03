import { z } from 'zod';

const rawEnv = {
  PORT: process.env.PORT,
  DATABASE_URL: process.env.DATABASE_URL,
};

const databaseUrlSchema = z.preprocess(
  (value) => (value === undefined ? '' : value),
  z
    .string()
    .min(1, 'DATABASE_URL is required. Set DATABASE_URL.')
    .refine((value) => {
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    }, 'DATABASE_URL must be a valid URL.'),
);

const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: databaseUrlSchema,
}).strict();

export const env = envSchema.parse(rawEnv);
export type Env = z.infer<typeof envSchema>;
