import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { createPublishHandlers } from './publish';

vi.mock('../generated/prisma', () => ({
  PrismaClient: vi.fn(),
}));

describe('POST /publish', () => {
  const mockPrisma = {
    $transaction: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createApp = () => {
    const app = new Hono();
    app.post('/publish', ...createPublishHandlers(mockPrisma as never));
    return app;
  };

  it('イベントと Outbox メッセージを同一トランザクションで作成する', async () => {
    const mockEvent = { id: 'event-123', data: 'test data', createdAt: new Date() };
    const mockOutbox = {
      id: 'outbox-456',
      eventId: 'event-123',
      payload: JSON.stringify({ id: 'event-123', data: 'test data' }),
      status: 'pending',
      createdAt: new Date(),
      publishedAt: null,
    };

    mockPrisma.$transaction.mockImplementation(async (callback) => {
      const tx = {
        event: {
          create: vi.fn().mockResolvedValue(mockEvent),
        },
        outboxMessage: {
          create: vi.fn().mockResolvedValue(mockOutbox),
        },
      };
      return callback(tx);
    });

    const app = createApp();
    const res = await app.request('/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: 'test data' }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toEqual({
      eventId: 'event-123',
      outboxMessageId: 'outbox-456',
      message: 'Event created and queued for publishing',
    });
    expect(mockPrisma.$transaction).toHaveBeenCalled();
  });

  it('データがない場合は 400 を返す', async () => {
    const app = createApp();
    const res = await app.request('/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    expect(res.status).toBe(400);
  });

  it('トランザクションが失敗した場合は 500 を返す', async () => {
    mockPrisma.$transaction.mockRejectedValue(new Error('Transaction failed'));

    const app = createApp();
    const res = await app.request('/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: 'test data' }),
    });

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to create event');
  });
});
