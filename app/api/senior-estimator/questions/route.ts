import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId');
    const analysisId = searchParams.get('analysisId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // Get questions for the session
    const whereClause: any = { sessionId };
    if (analysisId) {
      whereClause.analysisId = analysisId;
    }

    const questions = await db.estimatorQuestion.findMany({
      where: whereClause,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' }
      ],
      include: {
        session: {
          include: {
            user: true
          }
        }
      }
    });

    // Verify user owns this session
    if (questions.length > 0 && questions[0].session.user.clerkId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Format questions for frontend
    const formattedQuestions = questions.map(q => ({
      id: q.id,
      question: q.question,
      questionType: q.questionType,
      priority: q.priority,
      context: q.context,
      defaultAnswer: q.defaultAnswer,
      status: q.status,
      answer: q.userAnswer,
      options: parseOptions(q.context)
    }));

    return NextResponse.json({ questions: formattedQuestions });

  } catch (error) {
    console.error('Questions fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}

function parseOptions(context: any): { text: string; value: string }[] | undefined {
  if (!context || typeof context !== 'object') return undefined;
  
  // Check if context has options array
  if (Array.isArray(context.options)) {
    return context.options;
  }
  
  // Check for common patterns
  if (context.questionType === 'material_selection' && context.materials) {
    return context.materials.map((m: any) => ({
      text: m.name || m,
      value: m.id || m
    }));
  }
  
  if (context.questionType === 'quantity_confirmation' && context.suggested_values) {
    return context.suggested_values.map((v: any) => ({
      text: `${v.value} ${v.unit}`,
      value: v.value.toString()
    }));
  }
  
  return undefined;
}