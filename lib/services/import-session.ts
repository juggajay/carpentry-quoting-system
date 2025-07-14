// In-memory session storage (in production, use Redis or database)
export const importSessions = new Map<string, {
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