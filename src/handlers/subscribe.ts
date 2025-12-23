import { createFactory } from 'hono/factory';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

// Pub/Sub Push メッセージの Zod スキーマ
const pubSubPushMessageSchema = z.object({
  message: z.object({
    data: z.string(), // base64 エンコードされたデータ
    messageId: z.string(),
    publishTime: z.string(),
    attributes: z.record(z.string(), z.string()).optional(),
  }),
  subscription: z.string(),
});

export const subscribeHandlers = createFactory().createHandlers(
  zValidator('json', pubSubPushMessageSchema),
  (c) => {
    const pushMessage = c.req.valid('json');

    // base64 デコードしてメッセージデータを取得
    const decodedData = Buffer.from(pushMessage.message.data, 'base64').toString('utf-8');
    const messageData = JSON.parse(decodedData);

    console.log('[Subscribe] Received push message:');
    console.log(`  Message ID: ${pushMessage.message.messageId}`);
    console.log(`  Subscription: ${pushMessage.subscription}`);
    console.log(`  Data:`, messageData);

    return c.json({ message: 'Message received and logged' }, 200);
  },
);
