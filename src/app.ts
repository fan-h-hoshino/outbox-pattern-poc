import { Hono } from 'hono';
import { publishHandler } from './handlers/publish';
import { subscribeHandler } from './handlers/subscribe';
import type { PrismaClient } from '../generated/prisma/client';

export const createApp = (prisma: PrismaClient) => {
  const app = new Hono();

  app.get('/hello', (c) => {
    return c.json({ message: 'Hello World' });
  });

  app.post('/publish', publishHandler(prisma));
  app.post('/subscribe', subscribeHandler);

  return app;
};

// 後方互換性のためのデフォルトアプリ (テスト用)
export const app = new Hono();

app.get('/hello', (c) => {
  return c.json({ message: 'Hello World' });
});
