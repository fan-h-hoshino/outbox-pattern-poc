import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SubscriberWorker } from './subscriber-worker';
import type { IPubSubClient, PulledMessage } from './pubsub';

describe('SubscriberWorker', () => {
  const SUBSCRIPTION_NAME = 'my-subscription';
  const SUBSCRIBE_ENDPOINT = 'http://localhost:3000/subscribe';

  let mockPubSubClient: IPubSubClient;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPubSubClient = {
      publish: vi.fn(),
      ensureTopicExists: vi.fn(),
      ensureSubscriptionExists: vi.fn(),
      pullMessages: vi.fn(),
    };
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  describe('processMessages', () => {
    it('メッセージを pull して subscribe エンドポイントに送信する', async () => {
      const mockAck = vi.fn();
      const mockMessages: PulledMessage[] = [
        { id: 'msg-1', data: { eventId: '123', data: 'test' }, ack: mockAck, nack: vi.fn() },
      ];
      (mockPubSubClient.pullMessages as ReturnType<typeof vi.fn>).mockResolvedValue(mockMessages);
      mockFetch.mockResolvedValue({ ok: true });

      const worker = new SubscriberWorker(
        mockPubSubClient,
        SUBSCRIPTION_NAME,
        SUBSCRIBE_ENDPOINT,
        10,
      );
      const processed = await worker.processMessages();

      expect(mockPubSubClient.pullMessages).toHaveBeenCalledWith(SUBSCRIPTION_NAME, 10);
      expect(mockFetch).toHaveBeenCalledWith(SUBSCRIBE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: '123', data: 'test' }),
      });
      expect(mockAck).toHaveBeenCalled();
      expect(processed).toBe(1);
    });

    it('subscribe エンドポイントが失敗した場合は nack する', async () => {
      const mockAck = vi.fn();
      const mockNack = vi.fn();
      const mockMessages: PulledMessage[] = [
        { id: 'msg-1', data: { eventId: '123', data: 'test' }, ack: mockAck, nack: mockNack },
      ];
      (mockPubSubClient.pullMessages as ReturnType<typeof vi.fn>).mockResolvedValue(mockMessages);
      mockFetch.mockResolvedValue({ ok: false, status: 500 });

      const worker = new SubscriberWorker(
        mockPubSubClient,
        SUBSCRIPTION_NAME,
        SUBSCRIBE_ENDPOINT,
        10,
      );
      const processed = await worker.processMessages();

      expect(mockAck).not.toHaveBeenCalled();
      expect(mockNack).toHaveBeenCalled();
      expect(processed).toBe(0);
    });

    it('メッセージがない場合は何もしない', async () => {
      (mockPubSubClient.pullMessages as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const worker = new SubscriberWorker(
        mockPubSubClient,
        SUBSCRIPTION_NAME,
        SUBSCRIBE_ENDPOINT,
        10,
      );
      const processed = await worker.processMessages();

      expect(mockFetch).not.toHaveBeenCalled();
      expect(processed).toBe(0);
    });
  });
});
