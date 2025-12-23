import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { subscribeHandlers } from './subscribe';

describe('POST /subscribe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  const createApp = () => {
    const app = new Hono();
    app.post('/subscribe', ...subscribeHandlers);
    return app;
  };

  const createPushMessage = (data: unknown) => ({
    message: {
      data: Buffer.from(JSON.stringify(data)).toString('base64'),
      messageId: 'msg-123',
      publishTime: '2025-01-01T00:00:00.000Z',
    },
    subscription: 'projects/test-project/subscriptions/my-subscription',
  });

  it('Pub/Sub Push メッセージを受信して base64 デコードする', async () => {
    const app = createApp();
    const messageData = {
      id: 'event-123',
      data: 'test data',
    };
    const pushMessage = createPushMessage(messageData);

    const res = await app.request('/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pushMessage),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toBe('Message received and logged');
    expect(console.log).toHaveBeenCalledWith('[Subscribe] Received push message:');
    expect(console.log).toHaveBeenCalledWith('  Message ID: msg-123');
    expect(console.log).toHaveBeenCalledWith(
      '  Subscription: projects/test-project/subscriptions/my-subscription',
    );
    expect(console.log).toHaveBeenCalledWith('  Data:', messageData);
  });

  it('空のデータオブジェクトでも処理する', async () => {
    const app = createApp();
    const pushMessage = createPushMessage({});

    const res = await app.request('/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pushMessage),
    });

    expect(res.status).toBe(200);
    expect(console.log).toHaveBeenCalledWith('  Data:', {});
  });

  it('不正な形式のメッセージは 400 エラーを返す', async () => {
    const app = createApp();
    const invalidMessage = {
      invalid: 'data',
    };

    const res = await app.request('/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidMessage),
    });

    expect(res.status).toBe(400);
  });
});
