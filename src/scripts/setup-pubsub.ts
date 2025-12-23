import { readFileSync } from 'fs';
import { join } from 'path';
import { z } from 'zod';
import { config } from '../config';
import { TopicInitializer, PushSubscriptionInitializer } from '@modules/pubsub';
import { PubSub } from '@google-cloud/pubsub';

const pubSubConfigSchema = z.object({
  topics: z.array(
    z.object({
      name: z.string().min(1),
      subscriptions: z.array(
        z.object({
          name: z.string().min(1),
          endpoint: z.httpUrl(),
        }),
      ),
    }),
  ),
});

type PubSubConfig = z.infer<typeof pubSubConfigSchema>;

function loadPubSubConfig(): PubSubConfig {
  const configPath = join(import.meta.dirname, 'pubsub-config.json');
  const configContent = readFileSync(configPath, 'utf-8');
  const rawConfig: unknown = JSON.parse(configContent);

  const result = pubSubConfigSchema.safeParse(rawConfig);
  if (!result.success) {
    console.error('Invalid pubsub-config.json:', result.error.format());
    process.exit(1);
  }
  return result.data;
}

async function setup() {
  console.log('Setting up Pub/Sub topics and subscriptions...');
  console.log(`Emulator host: ${config.pubsub.emulatorHost}`);
  console.log(`Project ID: ${config.pubsub.projectId}`);

  const pubSubConfigJson = loadPubSubConfig();
  console.log(`Loaded config with ${pubSubConfigJson.topics.length} topic(s)`);

  const pubSubClient = new PubSub({
    projectId: config.pubsub.projectId,
  });
  const topicInitializer = new TopicInitializer(pubSubClient);
  const pushSubscriptionInitializer = new PushSubscriptionInitializer(pubSubClient);

  try {
    for (const topic of pubSubConfigJson.topics) {
      console.log(`\nCreating topic: ${topic.name}`);
      await topicInitializer.execute({ topicName: topic.name });
      console.log(`  ✓ Topic ${topic.name} is ready`);

      for (const subscription of topic.subscriptions) {
        console.log(`  Creating push subscription: ${subscription.name}`);
        console.log(`    Push endpoint: ${subscription.endpoint}`);
        await pushSubscriptionInitializer.execute({
          topicName: topic.name,
          subscriptionName: subscription.name,
          pushEndpoint: subscription.endpoint,
        });
        console.log(`  ✓ Push subscription ${subscription.name} is ready`);
      }
    }

    console.log('\n✓ Pub/Sub setup completed successfully!');
  } catch (error) {
    console.error('Failed to setup Pub/Sub:', error);
    process.exit(1);
  }
}

setup();
