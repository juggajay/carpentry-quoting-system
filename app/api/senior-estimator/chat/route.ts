import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { seniorEstimatorProcessor } from '@/lib/ai-assistant/senior-estimator-processor';
import { db } from '@/lib/db';

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

    // Get the user from the database
    const user = await db.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create or get estimator session
    let estimatorSession;
    if (sessionId) {
      estimatorSession = await db.estimatorSession.findUnique({
        where: { id: sessionId }
      });
    } else {
      estimatorSession = await db.estimatorSession.create({
        data: {
          userId: user.id,
          status: 'ACTIVE',
          context: {
            projectType,
            location,
            messages: []
          }
        }
      });
    }

    if (!estimatorSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Process the estimation request
    const estimationResult = await seniorEstimatorProcessor.processEstimationRequest({
      scope_text: message,
      drawing_files: projectFiles || [],
      project_type: projectType,
      location: location,
      session_id: estimatorSession.id,
      user_id: user.id
    });

    // Save the analysis results
    const analysis = await db.estimatorAnalysis.create({
      data: {
        sessionId: estimatorSession.id,
        scopeAnalysis: estimationResult.scope_analysis as any,
        drawingAnalyses: estimationResult.drawing_analyses as any,
        quoteItems: estimationResult.quote_items as any,
        confidenceSummary: estimationResult.confidence_summary as any,
        auditTrail: estimationResult.audit_trail as any,
        status: estimationResult.should_proceed ? 'READY_FOR_PRICING' : 'NEEDS_CLARIFICATION'
      }
    });

    // Save questions if any
    if (estimationResult.questions.length > 0) {
      await db.estimatorQuestion.createMany({
        data: estimationResult.questions.map(q => ({
          sessionId: estimatorSession.id,
          analysisId: analysis.id,
          question: q.question,
          questionType: q.type,
          priority: q.priority === 'high' ? 'HIGH' : q.priority === 'medium' ? 'MEDIUM' : 'LOW',
          context: q.context as any,
          defaultAnswer: q.options?.[0]?.text || '',
          status: 'PENDING'
        }))
      });
    }

    // Update session context
    const updatedContext = {
      ...estimatorSession.context as any,
      messages: [
        ...(estimatorSession.context as any).messages || [],
        {
          role: 'user',
          content: message,
          timestamp: new Date()
        },
        {
          role: 'assistant',
          content: {
            summary: `Analyzed ${estimationResult.scope_analysis.extractedItems.length} scope items`,
            confidence: estimationResult.confidence_summary.overall_confidence,
            questionsCount: estimationResult.questions.length,
            shouldProceed: estimationResult.should_proceed
          },
          timestamp: new Date()
        }
      ],
      lastAnalysisId: analysis.id
    };

    await db.estimatorSession.update({
      where: { id: estimatorSession.id },
      data: { 
        context: updatedContext,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      sessionId: estimatorSession.id,
      analysisId: analysis.id,
      result: estimationResult,
      nextSteps: estimationResult.next_steps,
      estimatedDuration: estimationResult.estimated_duration
    });

  } catch (error) {
    console.error('Senior Estimator Chat Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve session history
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      // Return all sessions for the user
      const sessions = await db.estimatorSession.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        include: {
          analyses: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      });

      return NextResponse.json({ sessions });
    }

    // Return specific session with full details
    const estimatorSession = await db.estimatorSession.findUnique({
      where: { id: sessionId },
      include: {
        analyses: {
          orderBy: { createdAt: 'desc' },
          include: {
            questions: true
          }
        }
      }
    });

    if (!estimatorSession || estimatorSession.userId !== user.id) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({ session: estimatorSession });

  } catch (error) {
    console.error('Senior Estimator GET Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}