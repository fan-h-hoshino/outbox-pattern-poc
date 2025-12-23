import { z } from 'zod';

const configSchema = z.object({
  database: z.object({
    host: z.string().min(1),
    port: z.coerce.number().int().positive(),
    user: z.string().min(1),
    password: z.string(),
    name: z.string().min(1),
    connectionLimit: z.coerce.number().int().positive(),
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
    host: process.env.DATABASE_HOST || 'localhost',
    port: process.env.DATABASE_PORT || '13306',
    user: process.env.DATABASE_USER || 'root',
    password: process.env.DATABASE_PASSWORD || 'password',
    name: process.env.DATABASE_NAME || 'outbox_pattern_poc',
    connectionLimit: process.env.DATABASE_CONNECTION_LIMIT || '5',
  },
  pubsub: {
    emulatorHost: process.env.PUBSUB_EMULATOR_HOST || 'localhost:18085',
    projectId: process.env.PUBSUB_PROJECT_ID || 'outbox-poc-project',
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
