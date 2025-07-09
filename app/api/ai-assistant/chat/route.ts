import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { ChatMessage, FileAttachment } from "@/lib/ai-assistant/types";
import { processChat } from "@/lib/ai-assistant/openai-service";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure user exists in our database
    const clerk = await clerkClient();
    const clerkUser = await clerk.users.getUser(userId);
    
    const dbUser = await prisma.user.upsert({
      where: { clerkId: userId },
      update: {
        email: clerkUser.emailAddresses[0]?.emailAddress || "",
        firstName: clerkUser.firstName || null,
        lastName: clerkUser.lastName || null,
      },
      create: {
        clerkId: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress || "",
        firstName: clerkUser.firstName || null,
        lastName: clerkUser.lastName || null,
      },
    });

    const body = await request.json();
    const { message, sessionId, attachments } = body;

    console.log('[CHAT API] Received:', {
      message: message?.substring(0, 100) + '...',
      sessionId,
      attachmentsCount: attachments?.length || 0,
      attachments: attachments?.map((a: FileAttachment) => ({ 
        name: a.name, 
        type: a.type, 
        size: a.size,
        hasContent: !!a.content,
        contentLength: a.content?.length || 0,
        parseError: a.parseError
      }))
    });

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Get or create session
    let session;
    if (sessionId) {
      session = await prisma.aISession.findUnique({
        where: { id: sessionId, userId: dbUser.id },
      });
    }

    if (!session) {
      session = await prisma.aISession.create({
        data: {
          userId: dbUser.id,
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
    console.log('[CHAT API] Sending to AI with', messages.length, 'messages and', attachments?.length || 0, 'attachments');
    
    // Debug log what we're sending to OpenAI
    if (attachments && attachments.length > 0) {
      console.log('[CHAT API] Attachment details being sent to OpenAI:', 
        attachments.map((a: FileAttachment) => ({
          name: a.name,
          hasContent: !!a.content,
          contentLength: a.content?.length || 0,
          contentPreview: a.content?.substring(0, 100) + '...',
          parseError: a.parseError
        }))
      );
    }
    
    const aiResponse = await processChat(messages, attachments);
    console.log('[CHAT API] AI Response:', {
      contentLength: aiResponse.content.length,
      hasQuote: !!aiResponse.quoteDraft,
      quoteItems: aiResponse.quoteDraft?.items.length || 0
    });

    // Create assistant message
    const assistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: aiResponse.content,
      timestamp: new Date(),
      quoteDraft: aiResponse.quoteDraft
    };

    messages.push(assistantMessage);

    // Update session with new messages and quote draft if present
    const updateData: Record<string, unknown> = {
      messages: JSON.parse(JSON.stringify(messages))
    };
    
    if (aiResponse.quoteDraft) {
      updateData.generatedQuote = JSON.parse(JSON.stringify(aiResponse.quoteDraft));
    }
    
    await prisma.aISession.update({
      where: { id: session.id },
      data: updateData,
    });

    return NextResponse.json({
      sessionId: session.id,
      message: assistantMessage,
    });
  } catch (error) {
    console.error("Error in chat API:", error);
    
    // Check if it's an OpenAI API key error
    if (error instanceof Error && error.message.includes('API key')) {
      return NextResponse.json(
        { error: "OpenAI API key not configured. Please add OPENAI_API_KEY to environment variables." },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}