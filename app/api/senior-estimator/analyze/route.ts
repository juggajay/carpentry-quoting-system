import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { seniorEstimatorProcessor } from '@/lib/ai-assistant/senior-estimator-processor';
import { fileParser } from '@/lib/ai-assistant/file-parser';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user from the database
    const user = await db.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const sessionId = formData.get('sessionId') as string;
    const scopeText = formData.get('scopeText') as string || '';
    const projectType = formData.get('projectType') as string || 'residential';
    const location = formData.get('location') as string || 'NSW, Australia';

    if (files.length === 0 && !scopeText) {
      return NextResponse.json({ error: 'No files or scope text provided' }, { status: 400 });
    }

    // Create or get estimator session
    let estimatorSession;
    if (sessionId) {
      estimatorSession = await db.estimatorSession.findUnique({
        where: { id: sessionId }
      });
      
      if (!estimatorSession || estimatorSession.userId !== user.id) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }
    } else {
      estimatorSession = await db.estimatorSession.create({
        data: {
          userId: user.id,
          status: 'ACTIVE',
          context: {
            projectType,
            location,
            messages: [],
            files: []
          }
        }
      });
    }

    // Process uploaded files
    const parsedFiles = [];
    for (const file of files) {
      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const parsed = await fileParser.parseFile(buffer, file.name, file.type);
        
        if (parsed) {
          parsedFiles.push(parsed);
          
          // Update session context with file info
          const context = estimatorSession.context as any;
          context.files = [...(context.files || []), {
            name: file.name,
            type: file.type,
            size: file.size,
            uploadedAt: new Date()
          }];
          
          await db.estimatorSession.update({
            where: { id: estimatorSession.id },
            data: { context }
          });
        }
      } catch (error) {
        console.error(`Error parsing file ${file.name}:`, error);
      }
    }

    // Combine scope text with extracted text from files
    let combinedScope = scopeText;
    if (parsedFiles.length > 0) {
      const extractedTexts = parsedFiles.map(f => f.text).filter(t => t);
      if (extractedTexts.length > 0) {
        combinedScope = scopeText ? `${scopeText}\n\n${extractedTexts.join('\n\n')}` : extractedTexts.join('\n\n');
      }
    }

    // Process the estimation request
    const estimationResult = await seniorEstimatorProcessor.processEstimationRequest({
      scope_text: combinedScope,
      drawing_files: parsedFiles,
      project_type: projectType as any,
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
      lastAnalysisId: analysis.id,
      filesProcessed: parsedFiles.length,
      scopeItemsFound: estimationResult.scope_analysis.extractedItems.length
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
      filesProcessed: parsedFiles.length,
      nextSteps: estimationResult.next_steps,
      estimatedDuration: estimationResult.estimated_duration
    });

  } catch (error) {
    console.error('Senior Estimator Analyze Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET endpoint to check analysis status
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
    const analysisId = searchParams.get('analysisId');

    if (!analysisId) {
      return NextResponse.json({ error: 'Analysis ID is required' }, { status: 400 });
    }

    const analysis = await db.estimatorAnalysis.findUnique({
      where: { id: analysisId },
      include: {
        session: true,
        questions: {
          orderBy: { priority: 'desc' }
        }
      }
    });

    if (!analysis || analysis.session.userId !== user.id) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    return NextResponse.json({ analysis });

  } catch (error) {
    console.error('Senior Estimator Analysis GET Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}