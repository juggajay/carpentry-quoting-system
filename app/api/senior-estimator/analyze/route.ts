import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { seniorEstimatorProcessor } from '@/lib/ai-assistant/senior-estimator-processor';
import { fileParser, ParsedFileContent } from '@/lib/ai-assistant/file-parser';
import { db } from '@/lib/db';

// Configure route to handle larger file uploads
export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds timeout

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

    // Vercel Pro supports up to 50MB
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 50 * 1024 * 1024) { // 50MB limit for Vercel Pro
      return NextResponse.json(
        { error: 'File size too large. Maximum file size is 50MB.' },
        { status: 413 }
      );
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

    // Check individual file sizes for Vercel Pro limit
    for (const file of files) {
      if (file.size > 50 * 1024 * 1024) { // 50MB per file for Vercel Pro
        return NextResponse.json(
          { error: `File "${file.name}" is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum file size is 50MB.` },
          { status: 413 }
        );
      }
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
            files: []
          }
        }
      });
    }

    // Process files
    const parsedFiles: ParsedFileContent[] = [];
    const failedFiles: { name: string; error: string }[] = [];
    
    for (const file of files) {
      try {
        console.log(`Processing file: ${file.name} (${file.size} bytes)`);
        
        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        // Parse the file
        const parsed = await fileParser.parseFile(buffer, file.name, file.type);
        if (parsed) {
          parsedFiles.push(parsed);
          console.log(`Successfully parsed ${file.name}: ${parsed.text.length} characters extracted`);
        } else {
          throw new Error('Failed to parse file');
        }
      } catch (error) {
        console.error(`Error parsing file ${file.name}:`, error);
        failedFiles.push({
          name: file.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // If all files failed to parse
    if (parsedFiles.length === 0 && files.length > 0) {
      return NextResponse.json({
        error: 'Failed to parse any files',
        failedFiles
      }, { status: 400 });
    }

    // Combine scope text with parsed content
    let combinedScope = scopeText;
    if (parsedFiles.length > 0) {
      const fileContents = parsedFiles.map(f => f.text).join('\n\n');
      combinedScope = scopeText ? `${scopeText}\n\n${fileContents}` : fileContents;
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

    // Update session context with file info
    const updatedContext = {
      ...estimatorSession.context as any,
      files: [
        ...(estimatorSession.context as any).files || [],
        ...files.map((file, index) => ({
          name: file.name,
          type: parsedFiles[index]?.type || 'unknown',
          uploadedAt: new Date()
        }))
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
      filesProcessed: parsedFiles.length,
      failedFiles: failedFiles.length > 0 ? failedFiles : undefined,
      nextSteps: estimationResult.next_steps,
      estimatedDuration: estimationResult.estimated_duration
    });

  } catch (error) {
    console.error('Senior Estimator Analyze Error:', error);
    
    // Check if it's a body size error
    if (error instanceof Error && error.message.includes('Body exceeded')) {
      return NextResponse.json(
        { error: 'Request body too large. Please upload smaller files or fewer files at once.' },
        { status: 413 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}