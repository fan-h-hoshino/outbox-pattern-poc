import { Hono } from 'hono';
import { createPublishHandlers } from './handlers/publish';
import { subscribeHandlers } from './handlers/subscribe';
import { streamingPublishHandlers } from './handlers/streaming-publish';
import type { PrismaClient } from '../generated/prisma/client';

export const createApp = (prisma: PrismaClient) => {
  const app = new Hono();

  app.post('/publish', ...createPublishHandlers(prisma));
  app.post('/subscribe', ...subscribeHandlers);
  app.post('/streaming/publish', ...streamingPublishHandlers);

  return app;
};
