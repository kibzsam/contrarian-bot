import { PrismaClient } from '@prisma/client';

export const db = new PrismaClient();

export async function initializeDatabase() {
  try {
    await db.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Failed to connect to database:', error);
    process.exit(1);
  }
}

export async function closeDatabaseConnection() {
  await db.$disconnect();
}
