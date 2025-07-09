import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ChunkedImportService } from '@/lib/services/chunked-import';

export async function GET(
  req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const jobStatus = await ChunkedImportService.getJobStatus(params.jobId, userId);
    
    if (!jobStatus) {
      return NextResponse.json(
        { error: 'Import job not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      job: jobStatus,
    });
  } catch (error) {
    console.error('Failed to get job status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get job status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cancelled = await ChunkedImportService.cancelJob(params.jobId, userId);
    
    if (!cancelled) {
      return NextResponse.json(
        { error: 'Cannot cancel this job. It may be completed or not found.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Import job cancelled',
    });
  } catch (error) {
    console.error('Failed to cancel job:', error);
    return NextResponse.json(
      { 
        error: 'Failed to cancel job',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}