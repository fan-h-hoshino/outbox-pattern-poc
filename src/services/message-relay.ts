import type { PrismaClient } from '../../generated/prisma/client';
import type { IPubSubClient } from './pubsub';

export class MessageRelay {
  private prisma: PrismaClient;
  private pubSubClient: IPubSubClient;
  private topicName: string;

  constructor(prisma: PrismaClient, pubSubClient: IPubSubClient, topicName: string) {
    this.prisma = prisma;
    this.pubSubClient = pubSubClient;
    this.topicName = topicName;
  }

  async processPendingMessages(): Promise<number> {
    const pendingMessages = await this.prisma.outboxMessage.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });

    let processedCount = 0;

    for (const message of pendingMessages) {
      try {
        await this.pubSubClient.publish(this.topicName, JSON.parse(message.payload));
        await this.prisma.outboxMessage.update({
          where: { id: message.id },
          data: {
            status: 'published',
            publishedAt: new Date(),
          },
        });
        processedCount++;
      } catch (error) {
        console.error(`Failed to publish message ${message.id}:`, error);
      }
    }

    return processedCount;
  }
}
