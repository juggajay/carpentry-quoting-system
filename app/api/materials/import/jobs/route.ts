import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ChunkedImportService } from '@/lib/services/chunked-import';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Temporary: Check if ImportJob table exists
    try {
      await prisma.$queryRaw`SELECT 1 FROM "ImportJob" LIMIT 1`;
    } catch (error) {
      console.log('ImportJob table not found - migration needed');
      return NextResponse.json({
        success: true,
        jobs: [],
        message: 'Import job tracking will be available after database migration'
      });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const jobs = await ChunkedImportService.getRecentJobs(userId, limit);

    return NextResponse.json({
      success: true,
      jobs,
    });
  } catch (error) {
    console.error('Failed to get import jobs:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get import jobs',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}