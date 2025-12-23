import { serve } from '@hono/node-server';
import { createApp } from './app';
import { config } from './config';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { createPubSubClient, MessagePublisher } from '@modules/pubsub';
import { MessageRelay } from '@modules/relay';

const adapter = new PrismaMariaDb({
  host: config.database.host,
  port: config.database.port,
  user: config.database.user,
  password: config.database.password,
  database: config.database.name,
  connectionLimit: config.database.connectionLimit,
});
const prisma = new PrismaClient({ adapter });

const pubSubClient = createPubSubClient({
  emulatorHost: config.pubsub.emulatorHost,
  projectId: config.pubsub.projectId,
});
const messagePublisher = new MessagePublisher(pubSubClient);

const app = createApp(prisma);

// Message Relay (Outbox からメッセージを取り出して Pub/Sub に送信)
const messageRelay = new MessageRelay(prisma, messagePublisher, config.pubsub.topicName);

// Message Relay のポーリング開始
const startMessageRelay = () => {
  setInterval(async () => {
    try {
      const processed = await messageRelay.execute();
      if (processed > 0) {
        console.log(`[MessageRelay] Processed ${processed} messages`);
      }
    } catch (error) {
      console.error('[MessageRelay] Error processing messages:', error);
    }
  }, config.relay.pollingIntervalMs);
};

console.log(`Server is running on http://localhost:${config.server.port}`);
console.log(`Pub/Sub Emulator: ${config.pubsub.emulatorHost}`);
console.log(`Topic: ${config.pubsub.topicName}, Subscription: ${config.pubsub.subscriptionName}`);

serve({
  fetch: app.fetch,
  port: config.server.port,
});

startMessageRelay();
