import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {

  try {
    // Test basic connection
    await db.$connect();
    
    // Try to count users
    const userCount = await db.user.count();
    
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
    await db.$disconnect();
  }
}