import { db } from './db';

export async function isDatabaseConnected(): Promise<boolean> {
  try {
    // Try a simple query to check connection
    await db.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection check failed:', error);
    return false;
  }
}

export async function ensureDatabaseConnection() {
  const isConnected = await isDatabaseConnected();
  if (!isConnected) {
    throw new Error('Database connection not available. Please check your connection settings.');
  }
}