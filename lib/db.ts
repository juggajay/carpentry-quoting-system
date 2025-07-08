import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

const prismaClientSingleton = () => {
  return new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
};

export const db = global.prisma || prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
  global.prisma = db;
}