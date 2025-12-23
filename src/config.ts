export const config = {
  pubsub: {
    emulatorHost: process.env.PUBSUB_EMULATOR_HOST || 'localhost:18085',
    projectId: process.env.PUBSUB_PROJECT_ID || 'outbox-poc-project',
    topicName: 'my-topic',
    subscriptionName: 'my-subscription',
  },
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    subscribeEndpoint: process.env.SUBSCRIBE_ENDPOINT || 'http://localhost:3000/subscribe',
  },
  relay: {
    pollingIntervalMs: parseInt(process.env.RELAY_POLLING_INTERVAL_MS || '5000', 10),
  },
  subscriber: {
    pollingIntervalMs: parseInt(process.env.SUBSCRIBER_POLLING_INTERVAL_MS || '5000', 10),
    maxMessages: parseInt(process.env.SUBSCRIBER_MAX_MESSAGES || '10', 10),
  },
};
