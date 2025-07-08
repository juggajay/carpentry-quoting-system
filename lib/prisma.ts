import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

const prismaClientSingleton = () => {
  // Use direct connection
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    throw new Error('Database connection string not found. Please set DATABASE_URL environment variable.');
  }

  console.log('Initializing Prisma with direct connection...');
  
  return new PrismaClient({
    datasources: {
      db: {
        url: connectionString,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
};

export const prisma = global.prisma || prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}