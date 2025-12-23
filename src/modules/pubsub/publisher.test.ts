import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MessagePublisher } from '@modules/pubsub';
import type { PubSub } from '@google-cloud/pubsub';

describe('MessagePublisher', () => {
  const TOPIC_NAME = 'my-topic';

  let mockPubSub: Partial<PubSub>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPubSub = {};
  });

  describe('execute', () => {
    it('指定したトピックにメッセージを送信する', async () => {
      const mockPublish = vi.fn().mockResolvedValue('message-id-123');
      mockPubSub.topic = vi.fn().mockReturnValue({ publishMessage: mockPublish });

      const publisher = new MessagePublisher(mockPubSub as PubSub);
      const messageId = await publisher.execute({
        topicName: TOPIC_NAME,
        data: { eventId: '123', data: 'test' },
      });

      expect(mockPubSub.topic).toHaveBeenCalledWith(TOPIC_NAME);
      expect(mockPublish).toHaveBeenCalledWith({
        data: Buffer.from(JSON.stringify({ eventId: '123', data: 'test' })),
      });
      expect(messageId).toBe('message-id-123');
    });
  });
});
