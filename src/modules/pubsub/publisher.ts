import type { PubSub } from '@google-cloud/pubsub';
import type { IService } from '@modules/interface';

export interface PublishInput {
  topicName: string;
  data: unknown;
}

export class MessagePublisher implements IService<PublishInput, string> {
  constructor(private readonly client: PubSub) {}

  async execute(input: PublishInput): Promise<string> {
    const topic = this.client.topic(input.topicName);
    const messageId = await topic.publishMessage({
      data: Buffer.from(JSON.stringify(input.data)),
    });
    return messageId;
  }
}
