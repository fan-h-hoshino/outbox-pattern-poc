import { createFactory } from 'hono/factory';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { PubSub } from '@google-cloud/pubsub';
import { config } from '../config';
import { MessagePublisher } from '@modules/pubsub';

const streamingPublishRequestSchema = z.object({
  data: z.string().min(1, 'data is required'),
});

const factory = createFactory();

const pubSubClient = new PubSub({
  projectId: config.pubsub.projectId,
});
const messagePublisher = new MessagePublisher(pubSubClient);

export const streamingPublishHandlers = factory.createHandlers(
  zValidator('json', streamingPublishRequestSchema),
  async (c) => {
    const body = c.req.valid('json');

    try {
      const messageId = await messagePublisher.execute({
        topicName: config.streaming.topicName,
        data: { data: body.data, timestamp: new Date().toISOString() },
      });

      return c.json(
        {
          messageId,
          message: 'Message published to streaming topic',
        },
        201,
      );
    } catch (error) {
      console.error('[StreamingPublish] Failed to publish:', error);
      return c.json({ error: 'Failed to publish message' }, 500);
    }
  },
);
