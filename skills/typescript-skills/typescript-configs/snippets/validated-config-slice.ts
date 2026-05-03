import { z } from 'zod';

const notificationsConfigSchema = z.object({
  topicArn: z.preprocess(
    (value) => (value === undefined ? '' : value),
    z.string().min(1, 'topicArn is required. Set NOTIFICATIONS_TOPIC_ARN.'),
  ),
}).strict();

export type NotificationsConfig = z.infer<typeof notificationsConfigSchema>;

export function createNotificationsConfig(env: Record<string, unknown>): NotificationsConfig {
  return notificationsConfigSchema.parse({
    topicArn: env.NOTIFICATIONS_TOPIC_ARN,
  });
}
