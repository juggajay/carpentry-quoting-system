import { NextResponse } from 'next/server';
import { AlternativeScraper } from '@/lib/services/alternative-scraper';

export async function GET() {
  try {
    const testUrl = 'https://www.canterburytimbers.com.au/collections/timber-all';
    
    console.log('Testing direct scrape of Canterbury Timbers...');
    const products = await AlternativeScraper.scrapeDirectly(testUrl);
    
    return NextResponse.json({
      success: true,
      url: testUrl,
      productCount: products.length,
      sampleProducts: products.slice(0, 5),
    });
  } catch (error) {
    console.error('Canterbury test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}