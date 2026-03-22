import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import config from '../config';

const pool = new Pool({
  connectionString: config.database.url,
});
const adapter = new PrismaPg(pool as any); // Type cast to avoid version conflicts
const prisma = new PrismaClient({ adapter });

export default prisma;