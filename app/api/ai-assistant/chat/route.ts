import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { ChatMessage } from "@/lib/ai-assistant/types";
import { processChat } from "@/lib/ai-assistant/openai-service";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { message, sessionId, attachments } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Get or create session
    let session;
    if (sessionId) {
      session = await prisma.aISession.findUnique({
        where: { id: sessionId, userId },
      });
    }

    if (!session) {
      session = await prisma.aISession.create({
        data: {
          userId,
          messages: [],
          status: 'active',
        },
      });
    }

    // Add user message to session
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: message,
      timestamp: new Date(),
      attachments,
    };

    const messages = [...(session.messages as unknown as ChatMessage[]), userMessage];

    // Process with OpenAI
    const aiResponse = await processChat(messages, attachments);

    // Create assistant message
    const assistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date(),
    };

    messages.push(assistantMessage);

    // Update session with new messages
    await prisma.aISession.update({
      where: { id: session.id },
      data: { messages: JSON.parse(JSON.stringify(messages)) },
    });

    return NextResponse.json({
      sessionId: session.id,
      message: assistantMessage,
    });
  } catch (error) {
    console.error("Error in chat API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}