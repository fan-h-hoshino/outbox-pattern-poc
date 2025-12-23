import type { PrismaClient } from '../../../generated/prisma/client';
import type { IService } from '@modules/interface';
import type { PublishInput } from '@modules/pubsub';

export class MessageRelay implements IService<void, number> {
  private prisma: PrismaClient;
  private messagePublisher: IService<PublishInput, string>;
  private topicName: string;

  constructor(
    prisma: PrismaClient,
    messagePublisher: IService<PublishInput, string>,
    topicName: string,
  ) {
    this.prisma = prisma;
    this.messagePublisher = messagePublisher;
    this.topicName = topicName;
  }

  async execute(): Promise<number> {
    const pendingMessages = await this.prisma.outboxMessage.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });

    let processedCount = 0;

    for (const message of pendingMessages) {
      try {
        await this.messagePublisher.execute({
          topicName: this.topicName,
          data: JSON.parse(message.payload),
        });
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
