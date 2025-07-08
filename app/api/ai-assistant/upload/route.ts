import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { FileAttachment } from "@/lib/ai-assistant/types";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll('files');
    const sessionId = formData.get('sessionId') as string | null;

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const processedFiles: FileAttachment[] = [];

    for (const file of files) {
      if (!(file instanceof File)) continue;

      // TODO: Implement actual file upload to storage
      // For now, just create file metadata
      const fileAttachment: FileAttachment = {
        id: crypto.randomUUID(),
        name: file.name,
        type: file.type,
        size: file.size,
        status: 'complete',
        // In production, you'd upload to cloud storage and get a URL
        url: `data:${file.type};base64,placeholder`,
      };

      processedFiles.push(fileAttachment);
    }

    // If there's a session, update it with the files
    if (sessionId) {
      const session = await prisma.aISession.findUnique({
        where: { id: sessionId, userId },
      });

      if (session) {
        const existingFiles = (session.files as unknown as FileAttachment[]) || [];
        await prisma.aISession.update({
          where: { id: sessionId },
          data: {
            files: JSON.parse(JSON.stringify([...existingFiles, ...processedFiles])),
          },
        });
      }
    }

    return NextResponse.json({
      files: processedFiles,
      message: `Successfully uploaded ${processedFiles.length} file(s)`,
    });
  } catch (error) {
    console.error("Error in upload API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds for file uploads