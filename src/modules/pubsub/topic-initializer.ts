import type { PubSub } from '@google-cloud/pubsub';
import type { IService } from '@modules/interface';

export interface CreateTopicInput {
  topicName: string;
}

export class TopicInitializer implements IService<CreateTopicInput, void> {
  constructor(private readonly client: PubSub) {}

  async execute(input: CreateTopicInput): Promise<void> {
    const topic = this.client.topic(input.topicName);
    const [exists] = await topic.exists();
    if (!exists) {
      await this.client.createTopic(input.topicName);
    }
  }
}
