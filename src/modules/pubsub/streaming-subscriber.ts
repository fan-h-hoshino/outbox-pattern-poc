import type { PubSub, Subscription, Message } from '@google-cloud/pubsub';

export class StreamingSubscriber {
  private readonly subscription: Subscription;

  constructor(
    client: PubSub,
    private readonly subscriptionName: string,
  ) {
    this.subscription = client.subscription(subscriptionName);
  }

  private handleMessage = (message: Message): void => {
    try {
      const data = JSON.parse(message.data.toString('utf-8'));
      console.log(`[StreamingSubscriber] Received message ${message.id}:`);
      console.log(`  Data:`, data);
      console.log(`  Attributes:`, message.attributes);
      message.ack();
    } catch (error) {
      console.error(`[StreamingSubscriber] Error processing message ${message.id}:`, error);
      message.nack();
    }
  };

  private handleError = (error: Error): void => {
    console.error('[StreamingSubscriber] Subscription error:', error);
  };

  start(): void {
    this.subscription.on('message', this.handleMessage);
    this.subscription.on('error', this.handleError);

    console.log(`[StreamingSubscriber] Listening for messages on ${this.subscriptionName}`);
  }
}
