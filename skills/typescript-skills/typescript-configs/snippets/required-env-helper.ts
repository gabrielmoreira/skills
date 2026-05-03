import { z } from 'zod';

export function requiredEnv(envName: string) {
  return z.preprocess(
    (value) => (value === undefined ? '' : value),
    z.string().min(1, `${envName} is required.`),
  );
}
