import { createFactory } from 'hono/factory';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { PrismaClient } from '../../generated/prisma/client';
import type { TransactionClient } from '../prisma/types';

const publishRequestSchema = z.object({
  data: z.string().min(1, 'data is required'),
});

const factory = createFactory();

export const createPublishHandlers = (prisma: PrismaClient) => {
  return factory.createHandlers(zValidator('json', publishRequestSchema), async (c) => {
    const body = c.req.valid('json');

    try {
      const result = await prisma.$transaction(async (tx: TransactionClient) => {
        const event = await tx.event.create({
          data: {
            data: body.data,
          },
        });

        const outboxMessage = await tx.outboxMessage.create({
          data: {
            eventId: event.id,
            payload: JSON.stringify({ id: event.id, data: event.data }),
            status: 'pending',
          },
        });

        return { event, outboxMessage };
      });

      return c.json(
        {
          eventId: result.event.id,
          outboxMessageId: result.outboxMessage.id,
          message: 'Event created and queued for publishing',
        },
        201,
      );
    } catch {
      return c.json({ error: 'Failed to create event' }, 500);
    }
  });
};
