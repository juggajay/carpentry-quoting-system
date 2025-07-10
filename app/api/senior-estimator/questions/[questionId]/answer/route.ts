import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ questionId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const { questionId } = params;
    const { answer } = await request.json();

    if (!answer) {
      return NextResponse.json({ error: 'Answer required' }, { status: 400 });
    }

    // Get the question and verify ownership
    const question = await db.estimatorQuestion.findUnique({
      where: { id: questionId },
      include: {
        session: {
          include: {
            user: true
          }
        }
      }
    });

    if (!question || question.session.user.clerkId !== userId) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // Update the question with the answer
    const updatedQuestion = await db.estimatorQuestion.update({
      where: { id: questionId },
      data: {
        userAnswer: answer,
        status: 'ANSWERED',
        answeredAt: new Date()
      }
    });

    // TODO: Trigger re-calculation of confidence scores based on the answer
    // This would involve:
    // 1. Finding the related quote items
    // 2. Updating their confidence based on the answer
    // 3. Potentially adjusting quantities or specifications

    return NextResponse.json({ 
      success: true, 
      question: updatedQuestion 
    });

  } catch (error) {
    console.error('Answer submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit answer' },
      { status: 500 }
    );
  }
}