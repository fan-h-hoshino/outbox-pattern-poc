import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StreamingSubscriptionCreator } from './streaming-subscription-creator';
import type { PubSub } from '@google-cloud/pubsub';

describe('StreamingSubscriptionCreator', () => {
  const TOPIC_NAME = 'my-streaming-topic';
  const SUBSCRIPTION_NAME = 'my-streaming-subscription';

  let mockPubSub: Partial<PubSub>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPubSub = {};
  });

  describe('execute', () => {
    it('サブスクリプションが存在しない場合は作成する', async () => {
      const mockCreateSubscription = vi.fn().mockResolvedValue([{}]);
      mockPubSub.subscription = vi.fn().mockReturnValue({
        exists: vi.fn().mockResolvedValue([false]),
      });
      mockPubSub.topic = vi.fn().mockReturnValue({
        createSubscription: mockCreateSubscription,
      });

      const creator = new StreamingSubscriptionCreator(mockPubSub as PubSub);
      await creator.execute({
        topicName: TOPIC_NAME,
        subscriptionName: SUBSCRIPTION_NAME,
      });

      expect(mockPubSub.subscription).toHaveBeenCalledWith(SUBSCRIPTION_NAME);
      expect(mockPubSub.topic).toHaveBeenCalledWith(TOPIC_NAME);
      expect(mockCreateSubscription).toHaveBeenCalledWith(SUBSCRIPTION_NAME);
    });

    it('サブスクリプションが既に存在する場合は作成しない', async () => {
      const mockCreateSubscription = vi.fn();
      mockPubSub.subscription = vi.fn().mockReturnValue({
        exists: vi.fn().mockResolvedValue([true]),
      });
      mockPubSub.topic = vi.fn().mockReturnValue({
        createSubscription: mockCreateSubscription,
      });

      const creator = new StreamingSubscriptionCreator(mockPubSub as PubSub);
      await creator.execute({
        topicName: TOPIC_NAME,
        subscriptionName: SUBSCRIPTION_NAME,
      });

      expect(mockPubSub.subscription).toHaveBeenCalledWith(SUBSCRIPTION_NAME);
      expect(mockCreateSubscription).not.toHaveBeenCalled();
    });
  });
});


