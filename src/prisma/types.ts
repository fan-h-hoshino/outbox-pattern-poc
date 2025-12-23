import type { PrismaClient } from '../../generated/prisma/client';

export type TransactionClient = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0];

