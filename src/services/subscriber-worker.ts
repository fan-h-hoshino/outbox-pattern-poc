import type { IPubSubClient } from './pubsub';

export class SubscriberWorker {
  private pubSubClient: IPubSubClient;
  private subscriptionName: string;
  private subscribeEndpoint: string;
  private maxMessages: number;

  constructor(
    pubSubClient: IPubSubClient,
    subscriptionName: string,
    subscribeEndpoint: string,
    maxMessages: number = 10,
  ) {
    this.pubSubClient = pubSubClient;
    this.subscriptionName = subscriptionName;
    this.subscribeEndpoint = subscribeEndpoint;
    this.maxMessages = maxMessages;
  }

  async processMessages(): Promise<number> {
    const messages = await this.pubSubClient.pullMessages(this.subscriptionName, this.maxMessages);

    let processedCount = 0;

    for (const message of messages) {
      try {
        const response = await fetch(this.subscribeEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(message.data),
        });

        if (response.ok) {
          message.ack();
          processedCount++;
        } else {
          console.error(`Subscribe endpoint returned ${response.status}`);
          message.nack();
        }
      } catch (error) {
        console.error('Failed to send message to subscribe endpoint:', error);
        message.nack();
      }
    }

    return processedCount;
  }
}
