import { Context } from 'hono';
import type { PrismaClient } from '../../generated/prisma/client';

interface PublishRequestBody {
  data?: string;
}

type TransactionClient = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0];

export const publishHandler = (prisma: PrismaClient) => async (c: Context) => {
  const body = await c.req.json<PublishRequestBody>();

  if (!body.data) {
    return c.json({ error: 'data is required' }, 400);
  }

  try {
    const result = await prisma.$transaction(async (tx: TransactionClient) => {
      const event = await tx.event.create({
        data: {
          data: body.data as string,
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
};
