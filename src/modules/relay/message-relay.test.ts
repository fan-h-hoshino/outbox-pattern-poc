import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MessageRelay } from '@modules/relay';
import type { IService } from '@modules/interface';
import type { PublishInput } from '@modules/pubsub';

describe('MessageRelay', () => {
  const TOPIC_NAME = 'my-topic';
  let mockPrisma: {
    outboxMessage: {
      findMany: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
  };
  let mockMessagePublisher: IService<PublishInput, string>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma = {
      outboxMessage: {
        findMany: vi.fn(),
        update: vi.fn(),
      },
    };
    mockMessagePublisher = {
      execute: vi.fn().mockResolvedValue('message-id'),
    };
  });

  describe('execute', () => {
    it('pending 状態のメッセージを取得して Pub/Sub に送信し、ステータスを更新する', async () => {
      const pendingMessages = [
        { id: 'outbox-1', eventId: 'event-1', payload: '{"data":"test1"}', status: 'pending' },
        { id: 'outbox-2', eventId: 'event-2', payload: '{"data":"test2"}', status: 'pending' },
      ];
      mockPrisma.outboxMessage.findMany.mockResolvedValue(pendingMessages);
      mockPrisma.outboxMessage.update.mockResolvedValue({});

      const relay = new MessageRelay(mockPrisma as never, mockMessagePublisher, TOPIC_NAME);
      const processed = await relay.execute();

      expect(mockPrisma.outboxMessage.findMany).toHaveBeenCalledWith({
        where: { status: 'pending' },
        orderBy: { createdAt: 'asc' },
        take: 100,
      });
      expect(mockMessagePublisher.execute).toHaveBeenCalledTimes(2);
      expect(mockPrisma.outboxMessage.update).toHaveBeenCalledTimes(2);
      expect(processed).toBe(2);
    });

    it('pending メッセージがない場合は何もしない', async () => {
      mockPrisma.outboxMessage.findMany.mockResolvedValue([]);

      const relay = new MessageRelay(mockPrisma as never, mockMessagePublisher, TOPIC_NAME);
      const processed = await relay.execute();

      expect(mockMessagePublisher.execute).not.toHaveBeenCalled();
      expect(mockPrisma.outboxMessage.update).not.toHaveBeenCalled();
      expect(processed).toBe(0);
    });

    it('Pub/Sub への送信が失敗した場合はステータスを更新しない', async () => {
      const pendingMessages = [
        { id: 'outbox-1', eventId: 'event-1', payload: '{"data":"test1"}', status: 'pending' },
      ];
      mockPrisma.outboxMessage.findMany.mockResolvedValue(pendingMessages);
      (mockMessagePublisher.execute as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Publish failed'),
      );

      const relay = new MessageRelay(mockPrisma as never, mockMessagePublisher, TOPIC_NAME);
      const processed = await relay.execute();

      expect(mockPrisma.outboxMessage.update).not.toHaveBeenCalled();
      expect(processed).toBe(0);
    });
  });
});
