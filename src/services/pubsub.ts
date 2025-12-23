import { PubSub, Message, Subscription } from '@google-cloud/pubsub';

export interface PubSubClientConfig {
  emulatorHost: string;
  projectId: string;
}

export interface PulledMessage {
  id: string;
  data: unknown;
  ack: () => void;
  nack: () => void;
}

export interface IPubSubClient {
  publish(topicName: string, data: unknown): Promise<string>;
  ensureTopicExists(topicName: string): Promise<void>;
  ensureSubscriptionExists(topicName: string, subscriptionName: string): Promise<void>;
  pullMessages(subscriptionName: string, maxMessages: number): Promise<PulledMessage[]>;
  startMessageListener(
    subscriptionName: string,
    messageHandler: (message: PulledMessage) => Promise<void>,
  ): Subscription;
}

export class PubSubClient implements IPubSubClient {
  private client: PubSub;

  constructor(config: PubSubClientConfig, client?: PubSub) {
    if (client) {
      this.client = client;
    } else {
      process.env.PUBSUB_EMULATOR_HOST = config.emulatorHost;
      this.client = new PubSub({ projectId: config.projectId });
    }
  }

  async publish(topicName: string, data: unknown): Promise<string> {
    const topic = this.client.topic(topicName);
    const messageId = await topic.publishMessage({
      data: Buffer.from(JSON.stringify(data)),
    });
    return messageId;
  }

  async ensureTopicExists(topicName: string): Promise<void> {
    const topic = this.client.topic(topicName);
    const [exists] = await topic.exists();
    if (!exists) {
      await this.client.createTopic(topicName);
    }
  }

  async ensureSubscriptionExists(topicName: string, subscriptionName: string): Promise<void> {
    const subscription = this.client.subscription(subscriptionName);
    const [exists] = await subscription.exists();
    if (!exists) {
      await this.client.topic(topicName).createSubscription(subscriptionName);
    }
  }

  async pullMessages(subscriptionName: string, maxMessages: number): Promise<PulledMessage[]> {
    // 最新のライブラリではストリーミングプルが推奨されているため、
    // 一時的なリスナーを使用してメッセージを取得します
    return new Promise((resolve) => {
      const subscription = this.client.subscription(subscriptionName);
      const messages: PulledMessage[] = [];

      const messageHandler = (msg: Message) => {
        if (messages.length < maxMessages) {
          messages.push({
            id: msg.id,
            data: JSON.parse(msg.data.toString()),
            ack: () => msg.ack(),
            nack: () => msg.nack(),
          });
        }
        if (messages.length >= maxMessages) {
          subscription.removeListener('message', messageHandler);
          resolve(messages);
        }
      };

      subscription.on('message', messageHandler);

      // タイムアウト後にメッセージがなければ空配列を返す
      setTimeout(() => {
        subscription.removeListener('message', messageHandler);
        resolve(messages);
      }, 1000);
    });
  }

  startMessageListener(
    subscriptionName: string,
    messageHandler: (message: PulledMessage) => Promise<void>,
  ): Subscription {
    const subscription = this.client.subscription(subscriptionName);

    subscription.on('message', async (msg: Message) => {
      const pulledMessage: PulledMessage = {
        id: msg.id,
        data: JSON.parse(msg.data.toString()),
        ack: () => msg.ack(),
        nack: () => msg.nack(),
      };
      await messageHandler(pulledMessage);
    });

    subscription.on('error', (error) => {
      console.error('[PubSubClient] Subscription error:', error);
    });

    return subscription;
  }
}
