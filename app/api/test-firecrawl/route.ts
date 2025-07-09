import { NextResponse } from 'next/server';
import FirecrawlApp from 'firecrawl';

export async function GET() {
  try {
    // Check if API key exists
    const apiKey = process.env.FIRECRAWL_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'FIRECRAWL_API_KEY not found in environment variables',
        env: process.env.NODE_ENV,
      });
    }

    // Try to import and initialize Firecrawl
    const firecrawl = new FirecrawlApp({ apiKey });

    // Test a simple scrape
    const testUrl = 'https://www.example.com';
    const result = await firecrawl.scrapeUrl(testUrl, {
      formats: ['markdown'],
      timeout: 10000,
    });

    return NextResponse.json({
      success: true,
      apiKeyPresent: true,
      apiKeyPrefix: apiKey.substring(0, 10) + '...',
      testScrapeSuccess: result.success,
      testScrapeHasContent: !!(result as any).markdown,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      apiKeyPresent: !!process.env.FIRECRAWL_API_KEY,
    });
  }
}