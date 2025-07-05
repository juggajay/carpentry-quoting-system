import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Get Clerk user
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ 
        error: 'Not authenticated',
        clerkUserId: null,
        dbUser: null 
      });
    }

    // Check if user exists in database
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    // Count all users
    const totalUsers = await prisma.user.count();

    return NextResponse.json({ 
      success: true,
      clerkUserId: userId,
      dbUser: dbUser,
      totalUsers: totalUsers,
      userExists: !!dbUser
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}