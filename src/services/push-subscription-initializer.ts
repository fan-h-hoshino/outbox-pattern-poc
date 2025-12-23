import type { PubSub } from '@google-cloud/pubsub';
import type { IService } from './service';

export interface CreatePushSubscriptionInput {
  topicName: string;
  subscriptionName: string;
  pushEndpoint: string;
}

export class PushSubscriptionInitializer implements IService<CreatePushSubscriptionInput, void> {
  constructor(private readonly client: PubSub) {}

  async execute(input: CreatePushSubscriptionInput): Promise<void> {
    const subscription = this.client.subscription(input.subscriptionName);
    const [exists] = await subscription.exists();
    if (!exists) {
      await this.client.topic(input.topicName).createSubscription(input.subscriptionName, {
        pushConfig: {
          pushEndpoint: input.pushEndpoint,
        },
      });
    }
  }
}
