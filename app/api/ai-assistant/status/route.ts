import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check various configurations without exposing sensitive data
    const status = {
      auth: {
        authenticated: true,
        userId
      },
      openai: {
        configured: !!process.env.OPENAI_API_KEY,
        keyLength: process.env.OPENAI_API_KEY?.length || 0,
        keyPrefix: process.env.OPENAI_API_KEY?.substring(0, 7) || 'not-set'
      },
      database: {
        configured: !!process.env.DATABASE_URL,
        type: process.env.DATABASE_URL?.includes('postgresql') ? 'postgresql' : 'unknown'
      },
      upload: {
        maxSize: '10MB',
        supportedTypes: ['pdf', 'xlsx', 'xls', 'csv', 'docx']
      },
      features: {
        pdfParsing: 'enabled',
        excelParsing: 'enabled',
        csvParsing: 'enabled',
        docxParsing: 'limited'
      }
    };

    return NextResponse.json(status);
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check status' },
      { status: 500 }
    );
  }
}