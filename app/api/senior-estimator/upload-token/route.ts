import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { db } from '@/lib/db';

export async function POST(request: NextRequest): Promise<NextResponse> {
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

    const body = (await request.json()) as HandleUploadBody;

    try {
      const jsonResponse = await handleUpload({
        body,
        request,
        onBeforeGenerateToken: async () => {
          // Optionally, you can refuse the upload here
          return {
            allowedContentTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'],
            tokenPayload: JSON.stringify({
              userId: user.id,
            }),
          };
        },
        onUploadCompleted: async ({ blob, tokenPayload }) => {
          // Get the userId from the token payload
          const { userId } = JSON.parse(tokenPayload);
          console.log('Upload completed:', blob.pathname, 'for user:', userId);
        },
      });

      return NextResponse.json(jsonResponse);
    } catch (error) {
      return NextResponse.json(
        { error: (error as Error).message },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Upload token error:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload token' },
      { status: 500 }
    );
  }
}