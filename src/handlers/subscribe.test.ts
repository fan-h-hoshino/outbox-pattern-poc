import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { subscribeHandler } from './subscribe';

describe('POST /subscribe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  const createApp = () => {
    const app = new Hono();
    app.post('/subscribe', subscribeHandler);
    return app;
  };

  it('受け取ったメッセージを console.log に出力する', async () => {
    const app = createApp();
    const message = {
      eventId: 'event-123',
      data: 'test data',
      timestamp: '2025-01-01T00:00:00.000Z',
    };

    const res = await app.request('/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toBe('Message received and logged');
    expect(console.log).toHaveBeenCalledWith('[Subscribe] Received message:', message);
  });

  it('空のボディでも処理する', async () => {
    const app = createApp();

    const res = await app.request('/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    expect(res.status).toBe(200);
    expect(console.log).toHaveBeenCalledWith('[Subscribe] Received message:', {});
  });
});
