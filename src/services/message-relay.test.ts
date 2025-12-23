import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MessageRelay } from './message-relay';
import type { IPubSubClient } from './pubsub';

describe('MessageRelay', () => {
  const TOPIC_NAME = 'my-topic';
  let mockPrisma: {
    outboxMessage: {
      findMany: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
  };
  let mockPubSubClient: IPubSubClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma = {
      outboxMessage: {
        findMany: vi.fn(),
        update: vi.fn(),
      },
    };
    mockPubSubClient = {
      publish: vi.fn().mockResolvedValue('message-id'),
      ensureTopicExists: vi.fn(),
      ensureSubscriptionExists: vi.fn(),
      pullMessages: vi.fn(),
    };
  });

  describe('processPendingMessages', () => {
    it('pending 状態のメッセージを取得して Pub/Sub に送信し、ステータスを更新する', async () => {
      const pendingMessages = [
        { id: 'outbox-1', eventId: 'event-1', payload: '{"data":"test1"}', status: 'pending' },
        { id: 'outbox-2', eventId: 'event-2', payload: '{"data":"test2"}', status: 'pending' },
      ];
      mockPrisma.outboxMessage.findMany.mockResolvedValue(pendingMessages);
      mockPrisma.outboxMessage.update.mockResolvedValue({});

      const relay = new MessageRelay(mockPrisma as never, mockPubSubClient, TOPIC_NAME);
      const processed = await relay.processPendingMessages();

      expect(mockPrisma.outboxMessage.findMany).toHaveBeenCalledWith({
        where: { status: 'pending' },
        orderBy: { createdAt: 'asc' },
        take: 100,
      });
      expect(mockPubSubClient.publish).toHaveBeenCalledTimes(2);
      expect(mockPrisma.outboxMessage.update).toHaveBeenCalledTimes(2);
      expect(processed).toBe(2);
    });

    it('pending メッセージがない場合は何もしない', async () => {
      mockPrisma.outboxMessage.findMany.mockResolvedValue([]);

      const relay = new MessageRelay(mockPrisma as never, mockPubSubClient, TOPIC_NAME);
      const processed = await relay.processPendingMessages();

      expect(mockPubSubClient.publish).not.toHaveBeenCalled();
      expect(mockPrisma.outboxMessage.update).not.toHaveBeenCalled();
      expect(processed).toBe(0);
    });

    it('Pub/Sub への送信が失敗した場合はステータスを更新しない', async () => {
      const pendingMessages = [
        { id: 'outbox-1', eventId: 'event-1', payload: '{"data":"test1"}', status: 'pending' },
      ];
      mockPrisma.outboxMessage.findMany.mockResolvedValue(pendingMessages);
      (mockPubSubClient.publish as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Publish failed'),
      );

      const relay = new MessageRelay(mockPrisma as never, mockPubSubClient, TOPIC_NAME);
      const processed = await relay.processPendingMessages();

      expect(mockPrisma.outboxMessage.update).not.toHaveBeenCalled();
      expect(processed).toBe(0);
    });
  });
});
