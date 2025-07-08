import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

declare global {
  var prisma: PrismaClient | undefined;
}

const prismaClientSingleton = () => {
  // Check if we're in Edge runtime
  const isEdgeRuntime = typeof globalThis.EdgeRuntime !== 'undefined';
  
  if (isEdgeRuntime || process.env.NODE_ENV === 'production') {
    // Use Prisma Data Proxy for Edge runtime
    const connectionString = process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL;
    
    if (!connectionString) {
      throw new Error('Database connection string not found');
    }
    
    // For now, use standard Prisma client
    // In production, you might want to use Prisma Data Proxy
    return new PrismaClient({
      datasources: {
        db: {
          url: connectionString,
        },
      },
      log: ['error'],
    });
  } else {
    // Standard Prisma client for development
    return new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      log: ['error', 'warn'],
    });
  }
};

export const prisma = global.prisma || prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}