import type { PrismaClient } from '../../../generated/prisma/client';
import type { OutboxMessageModel } from '../../../generated/prisma/models/OutboxMessage';
import type { IService } from '@modules/interface';
import type { PublishInput } from '@modules/pubsub';

const BATCH_SIZE = 1000;

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
    return await this.prisma.$transaction(async (tx) => {
      const pendingMessages = await tx.$queryRaw<OutboxMessageModel[]>`
        SELECT id, eventId, payload, status, createdAt, publishedAt
        FROM OutboxMessage
        WHERE status = 'pending'
        ORDER BY createdAt ASC
        LIMIT ${BATCH_SIZE}
        FOR UPDATE SKIP LOCKED
      `;

      let processedCount = 0;

      for (const message of pendingMessages) {
        try {
          await this.messagePublisher.execute({
            topicName: this.topicName,
            data: JSON.parse(message.payload),
          });
          await tx.outboxMessage.update({
            where: { id: message.id },
            data: {
              status: 'published',
              publishedAt: new Date(),
            },
          });
          processedCount++;
        } catch (error) {
          console.error(`Failed to publish message ${message.id}`);
          throw error;
        }
      }

      return processedCount;
    });
  }
}
