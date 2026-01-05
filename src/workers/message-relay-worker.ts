import { PubSub } from '@google-cloud/pubsub';
import { config } from '../config';
import { prisma } from '../prisma/client';
import { MessagePublisher } from '@modules/pubsub';
import { MessageRelay } from '@modules/relay';

const pubSubClient = new PubSub({
  projectId: config.pubsub.projectId,
});
const messagePublisher = new MessagePublisher(pubSubClient);
const messageRelay = new MessageRelay(prisma, messagePublisher, config.pubsub.topicName);

const poll = async () => {
  while (true) {
    try {
      const processed = await messageRelay.execute();
      if (processed > 0) {
        console.log(`[MessageRelay] Processed ${processed} messages`);
      }
    } catch (error) {
      console.error('[MessageRelay] Error processing messages:', error);
    }
  }
};

export const startMessageRelay = () => {
  poll();
};
