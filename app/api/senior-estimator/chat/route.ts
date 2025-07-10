import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { seniorEstimatorProcessor } from '@/lib/ai-assistant/senior-estimator-processor';
import { db } from '@/lib/db';
import { intentDetector } from '@/lib/ai-assistant/intent-detector';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message, sessionId, projectFiles, projectType, location, hasAnalyzedFiles } = body;

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

    // Check if this is a query about analyzed files
    if (hasAnalyzedFiles && sessionId) {
      console.log('Checking for analyses with sessionId:', sessionId);
      
      // Check for existing analyses in this session
      const existingAnalyses = await db.estimatorAnalysis.findMany({
        where: { sessionId },
        orderBy: { createdAt: 'desc' },
        take: 1
      });
      
      console.log('Found analyses:', existingAnalyses.length);
      
      if (existingAnalyses.length > 0) {
        const latestAnalysis = existingAnalyses[0];
        const scopeAnalysis = latestAnalysis.scopeAnalysis as any;
        const quoteItems = latestAnalysis.quoteItems as any;
        
        console.log('Scope analysis items:', scopeAnalysis?.extractedItems?.length || 0);
        console.log('Quote items:', quoteItems?.length || 0);
        
        // For queries about files, return the analysis summary
        if (message.toLowerCase().includes('file') || message.toLowerCase().includes('upload') || message.toLowerCase().includes('drawing')) {
          const itemCount = scopeAnalysis?.extractedItems?.length || 0;
          const quoteCount = quoteItems?.length || 0;
          
          let response = `I've analyzed your uploaded files.\n\n`;
          
          // Check if the items are just drawing headers
          const hasOnlyDrawingHeaders = scopeAnalysis?.extractedItems?.every((item: any) => 
            item.description.includes('DRAWING') || 
            item.description.includes('Drawing type') || 
            item.description.includes('Scale')
          );
          
          if (hasOnlyDrawingHeaders || itemCount < 3) {
            response = `I can see you've uploaded architectural drawings. Since these are visual documents with minimal text, I couldn't extract detailed scope items automatically.\n\n`;
            response += `**To get an accurate estimate, please describe:**\n`;
            response += `• What type of construction work you need\n`;
            response += `• Key elements visible in the drawings (e.g., "frame walls", "concrete slab", "roof structure")\n`;
            response += `• Any specific requirements or materials\n\n`;
            response += `For example: "I need framing for a single-story extension as shown in the drawings, including wall frames, roof trusses, and external cladding"`;
          } else {
            response += `📋 **${itemCount} scope items** extracted\n`;
            response += `💰 **${quoteCount} quote items** generated\n\n`;
            
            if (itemCount > 0) {
              response += `**Key items found:**\n`;
              scopeAnalysis.extractedItems.slice(0, 5).forEach((item: any) => {
                response += `• ${item.description}\n`;
              });
              if (itemCount > 5) {
                response += `• ... and ${itemCount - 5} more items\n`;
              }
            }
            
            response += `\n✅ The analysis is complete. You can see all details in the Estimates panel on the right.`;
          }
          
          return NextResponse.json({
            sessionId,
            result: {
              intent: 'file_query',
              message: response,
              confidence: 100,
              hasAnalysis: true,
              analysisId: latestAnalysis.id
            }
          });
        }
      } else {
        console.log('No analyses found for session:', sessionId);
      }
    }
    
    // Detect intent first
    const intentResult = intentDetector.detectIntent(message);
    
    // Handle non-construction queries
    if (intentResult.intent !== 'construction_scope') {
      let responseMessage = '';
      
      switch (intentResult.intent) {
        case 'file_query':
          if (hasAnalyzedFiles) {
            responseMessage = "I see you have files uploaded. Let me check the analysis results. You can view the extracted items in the Estimates panel on the right.";
          } else {
            responseMessage = "I can help you analyze architectural drawings and construction documents. Please upload your files using the File Import panel on the left, and I'll extract scope items, measurements, and quantities from them.";
          }
          break;
        case 'greeting':
          responseMessage = "Hello! I'm your Senior Estimator assistant. I can help you analyze construction scopes, extract quantities from drawings, and generate accurate estimates. How can I help you today?";
          break;
        case 'help':
          responseMessage = "I'm here to help with construction estimation! You can:\n\n1. **Type or paste your scope of work** - I'll analyze it and extract measurable items\n2. **Upload drawings** (PDF, images) - I'll identify elements and quantities\n3. **Ask questions** about your project - I'll help clarify scope items\n\nPlease make sure you've configured your project type and location first.";
          break;
        case 'question':
          responseMessage = "I understand you have a question. I'm specialized in construction estimation and can help with:\n- Analyzing scope of work\n- Extracting quantities from drawings\n- Identifying materials and labor requirements\n- NSW construction standards and practices\n\nWhat would you like to know about your construction project?";
          break;
        default:
          responseMessage = "I'm not sure how to help with that. I'm specialized in construction estimation. Please provide a scope of work or upload construction drawings for me to analyze.";
      }
      
      return NextResponse.json({
        sessionId: estimatorSession.id,
        result: {
          intent: intentResult.intent,
          message: responseMessage,
          confidence: intentResult.confidence,
          reason: intentResult.reason
        }
      });
    }

    // Process the estimation request for construction scopes
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