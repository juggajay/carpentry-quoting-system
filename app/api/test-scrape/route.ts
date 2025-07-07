import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test fetching from server-side
    const response = await fetch('https://www.bunnings.com.au/search/products?q=timber', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    return NextResponse.json({
      status: response.status,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries()),
      contentLength: response.headers.get('content-length'),
      message: 'Server-side fetch test complete'
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Server-side fetch failed'
    }, { status: 500 });
  }
}