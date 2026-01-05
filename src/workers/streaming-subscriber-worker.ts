import { PubSub } from '@google-cloud/pubsub';
import { config } from '../config';
import { StreamingSubscriber } from '@modules/pubsub';

const pubSubClient = new PubSub({
  projectId: config.pubsub.projectId,
});

const streamingSubscriber = new StreamingSubscriber(
  pubSubClient,
  config.streaming.subscriptionName,
);

export const startStreamingSubscriber = () => {
  console.log(
    `[StreamingSubscriberWorker] Starting subscriber for ${config.streaming.subscriptionName}`,
  );
  streamingSubscriber.start();
};
