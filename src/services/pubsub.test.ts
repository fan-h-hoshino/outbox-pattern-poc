import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PubSubClient } from './pubsub';
import { PubSub } from '@google-cloud/pubsub';

describe('PubSubClient', () => {
  const EMULATOR_HOST = 'localhost:8085';
  const PROJECT_ID = 'test-project';
  const TOPIC_NAME = 'my-topic';
  const SUBSCRIPTION_NAME = 'my-subscription';

  let mockPubSub: Partial<PubSub>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPubSub = {};
  });

  const createClient = () =>
    new PubSubClient(
      {
        emulatorHost: EMULATOR_HOST,
        projectId: PROJECT_ID,
      },
      mockPubSub as PubSub,
    );

  describe('publish', () => {
    it('指定したトピックにメッセージを送信する', async () => {
      const mockPublish = vi.fn().mockResolvedValue('message-id-123');
      mockPubSub.topic = vi.fn().mockReturnValue({ publishMessage: mockPublish });

      const client = createClient();
      const messageId = await client.publish(TOPIC_NAME, { eventId: '123', data: 'test' });

      expect(mockPubSub.topic).toHaveBeenCalledWith(TOPIC_NAME);
      expect(mockPublish).toHaveBeenCalledWith({
        data: Buffer.from(JSON.stringify({ eventId: '123', data: 'test' })),
      });
      expect(messageId).toBe('message-id-123');
    });
  });

  describe('ensureTopicExists', () => {
    it('トピックが存在しない場合は作成する', async () => {
      const mockCreateTopic = vi.fn().mockResolvedValue([{ name: TOPIC_NAME }]);
      const mockTopicExists = vi.fn().mockResolvedValue([false]);
      mockPubSub.topic = vi.fn().mockReturnValue({ exists: mockTopicExists });
      mockPubSub.createTopic = mockCreateTopic;

      const client = createClient();
      await client.ensureTopicExists(TOPIC_NAME);

      expect(mockCreateTopic).toHaveBeenCalledWith(TOPIC_NAME);
    });

    it('トピックが既に存在する場合は作成しない', async () => {
      const mockCreateTopic = vi.fn();
      const mockTopicExists = vi.fn().mockResolvedValue([true]);
      mockPubSub.topic = vi.fn().mockReturnValue({ exists: mockTopicExists });
      mockPubSub.createTopic = mockCreateTopic;

      const client = createClient();
      await client.ensureTopicExists(TOPIC_NAME);

      expect(mockCreateTopic).not.toHaveBeenCalled();
    });
  });

  describe('ensureSubscriptionExists', () => {
    it('サブスクリプションが存在しない場合は作成する', async () => {
      const mockCreateSubscription = vi.fn().mockResolvedValue([{ name: SUBSCRIPTION_NAME }]);
      const mockSubscriptionExists = vi.fn().mockResolvedValue([false]);
      mockPubSub.subscription = vi.fn().mockReturnValue({ exists: mockSubscriptionExists });
      mockPubSub.topic = vi.fn().mockReturnValue({ createSubscription: mockCreateSubscription });

      const client = createClient();
      await client.ensureSubscriptionExists(TOPIC_NAME, SUBSCRIPTION_NAME);

      expect(mockCreateSubscription).toHaveBeenCalledWith(SUBSCRIPTION_NAME);
    });

    it('サブスクリプションが既に存在する場合は作成しない', async () => {
      const mockCreateSubscription = vi.fn();
      const mockSubscriptionExists = vi.fn().mockResolvedValue([true]);
      mockPubSub.subscription = vi.fn().mockReturnValue({ exists: mockSubscriptionExists });
      mockPubSub.topic = vi.fn().mockReturnValue({ createSubscription: mockCreateSubscription });

      const client = createClient();
      await client.ensureSubscriptionExists(TOPIC_NAME, SUBSCRIPTION_NAME);

      expect(mockCreateSubscription).not.toHaveBeenCalled();
    });
  });

  describe('pullMessages', () => {
    it('サブスクリプションからメッセージを取得する', async () => {
      const mockMessage = {
        id: 'msg-1',
        data: Buffer.from(JSON.stringify({ eventId: '123' })),
        ack: vi.fn(),
        nack: vi.fn(),
      };
      const mockOn = vi.fn().mockImplementation((event, handler) => {
        if (event === 'message') {
          // 少し遅らせてメッセージを送信
          setTimeout(() => handler(mockMessage), 10);
        }
      });
      const mockRemoveListener = vi.fn();
      mockPubSub.subscription = vi.fn().mockReturnValue({
        on: mockOn,
        removeListener: mockRemoveListener,
      });

      const client = createClient();
      const messages = await client.pullMessages(SUBSCRIPTION_NAME, 10);

      expect(mockOn).toHaveBeenCalledWith('message', expect.any(Function));
      expect(messages).toHaveLength(1);
      expect(messages[0].id).toBe('msg-1');
    });
  });
});
