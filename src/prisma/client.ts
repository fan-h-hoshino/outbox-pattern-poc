import { PrismaClient } from '../../generated/prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { config } from '../config';

const adapter = new PrismaMariaDb(config.database.url);
export const prisma = new PrismaClient({ adapter });

