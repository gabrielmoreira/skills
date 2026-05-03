import { z } from 'zod';

const notificationsConfigSchema = z.discriminatedUnion('mode', [
  z.object({ mode: z.literal('disabled') }).strict(),
  z.object({
    mode: z.literal('sqs'),
    queueUrl: z.preprocess(
      (value) => (value === undefined ? '' : value),
      z.string().min(1, 'queueUrl is required. Set NOTIFICATIONS_QUEUE_URL.'),
    ),
  }).strict(),
]);

export function getNotificationsConfig(env: Record<string, unknown>) {
  const candidate = env.NOTIFICATIONS_ENABLED === 'true'
    ? { mode: 'sqs', queueUrl: env.NOTIFICATIONS_QUEUE_URL }
    : { mode: 'disabled' };

  return notificationsConfigSchema.parse(candidate);
}