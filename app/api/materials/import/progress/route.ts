import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { importProgress } from '@/lib/services/import-progress';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the current progress
    const progress = importProgress.getProgress();
    
    return NextResponse.json(progress);
  } catch (error) {
    console.error('Progress fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch progress' },
      { status: 500 }
    );
  }
}