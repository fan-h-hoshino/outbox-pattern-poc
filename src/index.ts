import { serve } from '@hono/node-server';
import { createApp } from './app';
import { config } from './config';
import { prisma } from './prisma/client';
import { startMessageRelay } from './workers/message-relay-worker';
import { startStreamingSubscriber } from './workers/streaming-subscriber-worker';

const app = createApp(prisma);

console.log(`Server is running on http://localhost:${config.server.port}`);
console.log(`Pub/Sub Emulator: ${config.pubsub.emulatorHost}`);
console.log(`Topic: ${config.pubsub.topicName}, Subscription: ${config.pubsub.subscriptionName}`);
console.log(
  `Streaming Topic: ${config.streaming.topicName}, Streaming Subscription: ${config.streaming.subscriptionName}`,
);

serve({
  fetch: app.fetch,
  port: config.server.port,
});

startMessageRelay();
startStreamingSubscriber();
