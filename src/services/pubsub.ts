import { PubSub } from '@google-cloud/pubsub';

export interface PubSubClientConfig {
  emulatorHost: string;
  projectId: string;
}

export function createPubSubClient(config: PubSubClientConfig): PubSub {
  process.env.PUBSUB_EMULATOR_HOST = config.emulatorHost;
  return new PubSub({ projectId: config.projectId });
}
