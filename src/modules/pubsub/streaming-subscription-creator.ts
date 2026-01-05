import type { PubSub } from '@google-cloud/pubsub';
import type { IService } from '@modules/interface';

export interface CreateStreamingSubscriptionInput {
  topicName: string;
  subscriptionName: string;
}

export class StreamingSubscriptionCreator
  implements IService<CreateStreamingSubscriptionInput, void>
{
  constructor(private readonly client: PubSub) {}

  async execute(input: CreateStreamingSubscriptionInput): Promise<void> {
    const subscription = this.client.subscription(input.subscriptionName);
    const [exists] = await subscription.exists();
    if (!exists) {
      await this.client.topic(input.topicName).createSubscription(input.subscriptionName);
    }
  }
}

