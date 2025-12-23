import { Context } from 'hono';

export const subscribeHandler = async (c: Context) => {
  const message = await c.req.json();
  console.log('[Subscribe] Received message:', message);
  return c.json({ message: 'Message received and logged' }, 200);
};
