import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { parseFileFromBuffer, extractBOQItems } from "@/lib/ai-assistant/file-parser-memory";
import type { FileAttachment } from "@/lib/ai-assistant/types";

export async function POST(request: NextRequest) {
  console.log('[API] Upload endpoint hit at:', new Date().toISOString());
  
  try {
    const { userId } = await auth();
    
    if (!userId) {
      console.error('[API] Unauthorized: No user ID');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log('[API] Authenticated user:', userId);

    const formData = await request.formData();
    // Handle both single file and multiple files
    const file = formData.get('file') as File | null;
    const files = file ? [file] : formData.getAll('files');
    const sessionId = formData.get('sessionId') as string | null;
    
    console.log('[API] Form data received:', {
      fileCount: files.length,
      sessionId,
      hasFile: !!file
    });

    if (!files || files.length === 0) {
      console.error('[API] No files provided');
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const processedFiles: FileAttachment[] = [];

    for (const file of files) {
      if (!(file instanceof File)) {
        console.warn('[API] Skipping non-file item');
        continue;
      }
      
      console.log('[API] Processing file:', {
        name: file.name,
        size: file.size,
        type: file.type
      });

      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv'
      ];

      if (!allowedTypes.includes(file.type)) {
        console.error('[API] Invalid file type:', file.type);
        return NextResponse.json(
          { error: `Invalid file type: ${file.type}` },
          { status: 400 }
        );
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        console.error('[API] File too large:', file.size);
        return NextResponse.json(
          { error: 'File too large. Maximum size is 10MB' },
          { status: 400 }
        );
      }

      // Get file buffer
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      console.log('[API] Processing file in memory:', file.name);
      
      // Parse file content from buffer
      let extractedContent = '';
      let parseError = null;
      
      try {
        const parsed = await parseFileFromBuffer(buffer, file.name, file.type);
        extractedContent = extractBOQItems(parsed.text);
        console.log('[API] Extracted content length:', extractedContent.length);
        console.log('[API] First 200 chars:', extractedContent.substring(0, 200));
      } catch (error) {
        console.error('[API] Error parsing file:', error);
        parseError = error instanceof Error ? error.message : 'Parse error';
      }
      
      // Convert buffer to base64 for storage
      const base64Content = buffer.toString('base64');
      const dataUrl = `data:${file.type};base64,${base64Content}`;
      
      const fileAttachment: FileAttachment = {
        id: crypto.randomUUID(),
        name: file.name,
        type: file.type,
        size: file.size,
        status: 'complete',
        url: dataUrl, // Store as data URL
        content: extractedContent,
        parseError: parseError || undefined
      } as FileAttachment;

      console.log('[API] File processed successfully:', fileAttachment.id);
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

    const response = {
      files: processedFiles,
      message: `Successfully uploaded ${processedFiles.length} file(s)`,
      // For single file upload, include direct file properties
      ...(processedFiles.length === 1 && {
        success: true,
        url: processedFiles[0].url,
        filename: processedFiles[0].name,
        originalName: processedFiles[0].name,
        size: processedFiles[0].size
      })
    };

    console.log('[API] Upload successful:', response);
    return NextResponse.json(response);
  } catch (error) {
    console.error('[API] Upload error:', error);
    console.error('[API] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      type: error?.constructor?.name || 'Unknown'
    });
    
    // More specific error messages
    if (error instanceof Error) {
      if (error.message.includes('ENOENT')) {
        return NextResponse.json(
          { error: 'File system error: Unable to save file. Please try again.' },
          { status: 500 }
        );
      }
      if (error.message.includes('pdf-parse')) {
        return NextResponse.json(
          { error: 'PDF parsing error. Please try uploading an Excel or CSV file instead.' },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds for file uploads