import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { seniorEstimatorProcessor } from '@/lib/ai-assistant/senior-estimator-processor';

// This is a demo endpoint that works without database persistence
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

    // Process the estimation request
    const estimationResult = await seniorEstimatorProcessor.processEstimationRequest({
      scope_text: message,
      drawing_files: projectFiles || [],
      project_type: projectType,
      location: location,
      session_id: sessionId || 'demo-session-' + Date.now(),
      user_id: userId
    });

    // Return results without database persistence
    return NextResponse.json({
      sessionId: sessionId || 'demo-session-' + Date.now(),
      analysisId: 'demo-analysis-' + Date.now(),
      result: estimationResult,
      nextSteps: estimationResult.next_steps,
      estimatedDuration: estimationResult.estimated_duration,
      demoMode: true,
      message: 'Running in demo mode - results are not persisted'
    });

  } catch (error) {
    console.error('Senior Estimator Demo Error:', error);
    
    // Provide more helpful error messages
    if (error instanceof Error) {
      if (error.message.includes('OPENAI_API_KEY')) {
        return NextResponse.json(
          { error: 'OpenAI API key not configured. Please set OPENAI_API_KEY in environment variables.' },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}