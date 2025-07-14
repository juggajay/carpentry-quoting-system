import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { cuid } from '@/lib/utils';

// In-memory session storage (in production, use Redis or database)
const importSessions = new Map<string, {
  id: string;
  userId: string;
  totalProducts: number;
  processedProducts: number;
  imported: number;
  updated: number;
  skipped: number;
  errors: number;
  startedAt: Date;
  lastActivityAt: Date;
  status: 'active' | 'completed' | 'failed';
}>();

// Clean up old sessions after 30 minutes
setInterval(() => {
  const now = new Date();
  for (const [id, session] of importSessions.entries()) {
    if (now.getTime() - session.lastActivityAt.getTime() > 30 * 60 * 1000) {
      importSessions.delete(id);
    }
  }
}, 5 * 60 * 1000); // Run every 5 minutes

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { totalProducts } = body;

    if (!totalProducts || totalProducts <= 0) {
      return NextResponse.json({ error: 'Invalid total products' }, { status: 400 });
    }

    const sessionId = cuid();
    const session = {
      id: sessionId,
      userId,
      totalProducts,
      processedProducts: 0,
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
      startedAt: new Date(),
      lastActivityAt: new Date(),
      status: 'active' as const,
    };

    importSessions.set(sessionId, session);

    return NextResponse.json({
      sessionId,
      session,
    });
  } catch (error) {
    console.error('Session creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create import session' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    const session = importSessions.get(sessionId);
    if (!session || session.userId !== userId) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error('Session fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { sessionId, updates } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    const session = importSessions.get(sessionId);
    if (!session || session.userId !== userId) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Update session with new values
    Object.assign(session, {
      ...updates,
      lastActivityAt: new Date(),
    });

    // Check if import is complete
    if (session.processedProducts >= session.totalProducts) {
      session.status = 'completed';
    }

    importSessions.set(sessionId, session);

    return NextResponse.json(session);
  } catch (error) {
    console.error('Session update error:', error);
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    );
  }
}

// Export session getter for use in import route
export function getImportSession(sessionId: string) {
  return importSessions.get(sessionId);
}

export function updateImportSession(sessionId: string, updates: Partial<typeof importSessions extends Map<string, infer T> ? T : never>) {
  const session = importSessions.get(sessionId);
  if (session) {
    Object.assign(session, {
      ...updates,
      lastActivityAt: new Date(),
    });
    importSessions.set(sessionId, session);
  }
  return session;
}