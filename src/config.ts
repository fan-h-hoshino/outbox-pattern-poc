import { z } from 'zod';

const configSchema = z.object({
  database: z.object({
    url: z.url(),
  }),
  pubsub: z.object({
    emulatorHost: z.string().min(1),
    projectId: z.string().min(1),
    topicName: z.string().min(1),
    subscriptionName: z.string().min(1),
  }),
  server: z.object({
    port: z.coerce.number().int().positive(),
  }),
  relay: z.object({
    pollingIntervalMs: z.coerce.number().int().positive(),
  }),
});

export type Config = z.infer<typeof configSchema>;

const rawConfig = {
  database: {
    url: process.env.DATABASE_URL,
  },
  pubsub: {
    emulatorHost: process.env.PUBSUB_EMULATOR_HOST,
    projectId: process.env.PUBSUB_PROJECT_ID,
    topicName: 'my-topic',
    subscriptionName: 'my-subscription',
  },
  server: {
    port: process.env.PORT || '3000',
  },
  relay: {
    pollingIntervalMs: process.env.RELAY_POLLING_INTERVAL_MS || '5000',
  },
};

export const config = configSchema.parse(rawConfig);
