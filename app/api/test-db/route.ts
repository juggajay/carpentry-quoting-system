import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export async function GET() {
  const prisma = new PrismaClient({
    log: ['query', 'error', 'warn'],
  });

  try {
    // Test basic connection
    await prisma.$connect();
    
    // Try to count users
    const userCount = await prisma.user.count();
    
    return NextResponse.json({ 
      success: true, 
      userCount,
      databaseUrl: process.env.DATABASE_URL?.replace(/:[^:]*@/, ':****@') // Hide password
    });
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      type: error?.constructor?.name,
      databaseUrl: process.env.DATABASE_URL?.replace(/:[^:]*@/, ':****@') // Hide password
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}