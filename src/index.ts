import { serve } from '@hono/node-server';
import { createApp } from './app';
import { config } from './config';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PubSubClient } from './services/pubsub';
import { MessageRelay } from './services/message-relay';
import { SubscriberWorker } from './services/subscriber-worker';

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '13306', 10),
  user: process.env.DATABASE_USER || 'root',
  password: process.env.DATABASE_PASSWORD || 'password',
  database: process.env.DATABASE_NAME || 'outbox_pattern_poc',
  connectionLimit: 5,
});
const prisma = new PrismaClient({ adapter });

const pubSubClient = new PubSubClient({
  emulatorHost: config.pubsub.emulatorHost,
  projectId: config.pubsub.projectId,
});

const app = createApp(prisma);

// Message Relay (Outbox からメッセージを取り出して Pub/Sub に送信)
const messageRelay = new MessageRelay(prisma, pubSubClient, config.pubsub.topicName);

// Subscriber Worker (Pub/Sub からメッセージを取得して /subscribe に送信)
const subscriberWorker = new SubscriberWorker(
  pubSubClient,
  config.pubsub.subscriptionName,
  config.server.subscribeEndpoint,
  config.subscriber.maxMessages,
);

// Message Relay のポーリング開始
const startMessageRelay = () => {
  setInterval(async () => {
    try {
      const processed = await messageRelay.processPendingMessages();
      if (processed > 0) {
        console.log(`[MessageRelay] Processed ${processed} messages`);
      }
    } catch (error) {
      console.error('[MessageRelay] Error processing messages:', error);
    }
  }, config.relay.pollingIntervalMs);
};

// Subscriber Worker のポーリング開始
const startSubscriberWorker = () => {
  setInterval(async () => {
    try {
      const processed = await subscriberWorker.processMessages();
      if (processed > 0) {
        console.log(`[SubscriberWorker] Processed ${processed} messages`);
      }
    } catch (error) {
      console.error('[SubscriberWorker] Error processing messages:', error);
    }
  }, config.subscriber.pollingIntervalMs);
};

console.log(`Server is running on http://localhost:${config.server.port}`);
console.log(`Pub/Sub Emulator: ${config.pubsub.emulatorHost}`);
console.log(`Topic: ${config.pubsub.topicName}, Subscription: ${config.pubsub.subscriptionName}`);

serve({
  fetch: app.fetch,
  port: config.server.port,
});

startMessageRelay();
startSubscriberWorker();
