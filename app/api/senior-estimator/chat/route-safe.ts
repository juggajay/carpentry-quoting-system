import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { seniorEstimatorProcessor } from '@/lib/ai-assistant/senior-estimator-processor';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message, sessionId, projectFiles, projectType, location } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Process the estimation request without database
    const estimationResult = await seniorEstimatorProcessor.processEstimationRequest({
      scope_text: message,
      drawing_files: projectFiles || [],
      project_type: projectType,
      location: location,
      session_id: sessionId || 'temp-' + Date.now(),
      user_id: userId
    });

    // Return results without database persistence
    return NextResponse.json({
      sessionId: sessionId || 'temp-' + Date.now(),
      analysisId: 'temp-analysis-' + Date.now(),
      result: estimationResult,
      nextSteps: estimationResult.next_steps,
      estimatedDuration: estimationResult.estimated_duration,
      warning: 'Running in demo mode - results are not persisted to database'
    });

  } catch (error) {
    console.error('Senior Estimator Chat Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}