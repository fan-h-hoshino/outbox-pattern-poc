import { PubSubClient } from '../services/pubsub';

const TOPIC_NAME = 'my-topic';
const SUBSCRIPTION_NAME = 'my-subscription';
const EMULATOR_HOST = process.env.PUBSUB_EMULATOR_HOST || 'localhost:18085';
const PROJECT_ID = process.env.PUBSUB_PROJECT_ID || 'outbox-poc-project';

async function setup() {
  console.log('Setting up Pub/Sub topic and subscription...');
  console.log(`Emulator host: ${EMULATOR_HOST}`);
  console.log(`Project ID: ${PROJECT_ID}`);

  const client = new PubSubClient({
    emulatorHost: EMULATOR_HOST,
    projectId: PROJECT_ID,
  });

  try {
    console.log(`Creating topic: ${TOPIC_NAME}`);
    await client.ensureTopicExists(TOPIC_NAME);
    console.log(`Topic ${TOPIC_NAME} is ready`);

    console.log(`Creating subscription: ${SUBSCRIPTION_NAME}`);
    await client.ensureSubscriptionExists(TOPIC_NAME, SUBSCRIPTION_NAME);
    console.log(`Subscription ${SUBSCRIPTION_NAME} is ready`);

    console.log('Pub/Sub setup completed successfully!');
  } catch (error) {
    console.error('Failed to setup Pub/Sub:', error);
    process.exit(1);
  }
}

setup();
